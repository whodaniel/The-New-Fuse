#!/bin/sh
# Railway entrypoint for picoclaw - writes config from env vars then starts picoclaw

CONFIG_FILE="/root/.picoclaw/config.json"

# Create config directory
mkdir -p /root/.picoclaw/workspace

# Railway health checks expect port $PORT (usually 8080)
# Gateway runs on different port (18790 by default)
HEALTH_PORT="${PORT:-8080}"
GATEWAY_PORT="${PICOCLAW_GATEWAY_PORT:-${PORT:-8080}}"

# Normalize Kilo-compatible key aliases used across TNF services.
RESOLVED_KILO_API_KEY="${KILO_API_KEY:-${KILOCODE_API_KEY:-${API_KEY:-${ZEROCLAW_API_KEY:-}}}}"

# Optional centralized LLM routing (adaptive middleware control plane)
ROUTING_API_BASE="${TNF_LLM_ROUTING_API_BASE:-}"
ROUTING_TOKEN="${TNF_LLM_ROUTING_TOKEN:-}"
ROUTING_TARGET="${TNF_LLM_TARGET:-${TNF_AGENT_ROLE:-picoclaw-overseer}}"

resolve_routing_provider() {
  raw="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  case "$raw" in
    custom:*)
      echo "openai|${raw#custom:}"
      ;;
    kilo|kilocode)
      echo "openai|https://api.kilo.ai/api/gateway"
      ;;
    *)
      echo "${raw}|"
      ;;
  esac
}

if [ -n "${ROUTING_API_BASE}" ]; then
  ENCODED_TARGET="$(printf '%s' "${ROUTING_TARGET}" | sed 's/ /%20/g')"
  ROUTING_URL_PUBLIC="${ROUTING_API_BASE%/}/api/agent-proxy/adaptive/config/${ENCODED_TARGET}"
  ROUTING_URL_ADMIN="${ROUTING_API_BASE%/}/admin/config/llm-routing/effective/${ENCODED_TARGET}"
  AUTH_HEADER=""
  if [ -n "${ROUTING_TOKEN}" ]; then
    AUTH_HEADER="Authorization: Bearer ${ROUTING_TOKEN}"
  fi

  ROUTING_JSON="$(curl -fsS "${ROUTING_URL_PUBLIC}" 2>/dev/null || true)"
  if [ -z "${ROUTING_JSON}" ]; then
    if [ -n "${AUTH_HEADER}" ]; then
      ROUTING_JSON="$(curl -fsS -H "${AUTH_HEADER}" "${ROUTING_URL_ADMIN}" 2>/dev/null || true)"
    else
      ROUTING_JSON="$(curl -fsS "${ROUTING_URL_ADMIN}" 2>/dev/null || true)"
    fi
  fi

  if [ -n "${ROUTING_JSON}" ] && command -v jq >/dev/null 2>&1; then
    PRIMARY_PROVIDER="$(printf '%s' "${ROUTING_JSON}" | jq -r '.primary.provider // empty')"
    PRIMARY_MODEL="$(printf '%s' "${ROUTING_JSON}" | jq -r '.primary.model // empty')"
    FALLBACK_PROVIDER="$(printf '%s' "${ROUTING_JSON}" | jq -r '.fallback.provider // empty')"
    FALLBACK_MODEL="$(printf '%s' "${ROUTING_JSON}" | jq -r '.fallback.model // empty')"

    RESOLVED_PROVIDER="${PRIMARY_PROVIDER}"
    RESOLVED_MODEL="${PRIMARY_MODEL}"
    if [ -z "${RESOLVED_PROVIDER}" ] || [ -z "${RESOLVED_MODEL}" ]; then
      RESOLVED_PROVIDER="${FALLBACK_PROVIDER}"
      RESOLVED_MODEL="${FALLBACK_MODEL}"
    fi

    if [ -n "${RESOLVED_PROVIDER}" ] && [ -n "${RESOLVED_MODEL}" ]; then
      MAPPED="$(resolve_routing_provider "${RESOLVED_PROVIDER}")"
      PICOCLAW_AGENTS_DEFAULTS_PROVIDER="${MAPPED%%|*}"
      ROUTING_API_BASE_OVERRIDE="${MAPPED#*|}"
      PICOCLAW_AGENTS_DEFAULTS_MODEL="${RESOLVED_MODEL}"
      if [ -n "${ROUTING_API_BASE_OVERRIDE}" ]; then
        PICOCLAW_PROVIDERS_OPENAI_API_BASE="${ROUTING_API_BASE_OVERRIDE}"
      fi
      export PICOCLAW_AGENTS_DEFAULTS_PROVIDER
      export PICOCLAW_AGENTS_DEFAULTS_MODEL
      export PICOCLAW_PROVIDERS_OPENAI_API_BASE
      echo "Applied centralized routing target '${ROUTING_TARGET}' => ${PICOCLAW_AGENTS_DEFAULTS_PROVIDER}/${PICOCLAW_AGENTS_DEFAULTS_MODEL}"
    else
      echo "Centralized routing returned no usable primary/fallback for target '${ROUTING_TARGET}'"
    fi
  fi
fi

# Write config from env vars or use defaults
cat > "$CONFIG_FILE" << EOF
{
  "agents": {
    "defaults": {
      "workspace": "/root/.picoclaw/workspace",
      "restrict_to_workspace": false,
      "provider": "${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}",
      "model": "${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}",
      "max_tokens": ${PICOCLAW_AGENTS_DEFAULTS_MAX_TOKENS:-8192},
      "temperature": ${PICOCLAW_AGENTS_DEFAULTS_TEMPERATURE:-0.7},
      "max_tool_iterations": ${PICOCLAW_AGENTS_DEFAULTS_MAX_TOOL_ITERATIONS:-20}
    }
  },
  "providers": {
    "anthropic": {
      "api_key": "${PICOCLAW_PROVIDERS_ANTHROPIC_API_KEY:-${ANTHROPIC_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_ANTHROPIC_API_BASE:-}"
    },
    "openai": {
      "api_key": "${PICOCLAW_PROVIDERS_OPENAI_API_KEY:-${OPENAI_API_KEY:-${RESOLVED_KILO_API_KEY:-}}}",
      "api_base": "${PICOCLAW_PROVIDERS_OPENAI_API_BASE:-https://api.kilo.ai/api/gateway}"
    },
    "openrouter": {
      "api_key": "${PICOCLAW_PROVIDERS_OPENROUTER_API_KEY:-${OPENROUTER_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_OPENROUTER_API_BASE:-}"
    },
    "groq": {
      "api_key": "${PICOCLAW_PROVIDERS_GROQ_API_KEY:-${GROQ_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_GROQ_API_BASE:-}"
    },
    "zhipu": {
      "api_key": "${PICOCLAW_PROVIDERS_ZHIPU_API_KEY:-${ZHIPU_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_ZHIPU_API_BASE:-}"
    },
    "gemini": {
      "api_key": "${PICOCLAW_PROVIDERS_GEMINI_API_KEY:-${GEMINI_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_GEMINI_API_BASE:-}"
    },
    "kilo": {
      "api_key": "${PICOCLAW_PROVIDERS_KILO_API_KEY:-${RESOLVED_KILO_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_KILO_API_BASE:-https://api.kilo.ai/api/gateway}"
    }
  },
  "gateway": {
    "host": "0.0.0.0",
    "port": ${GATEWAY_PORT}
  },
  "heartbeat": {
    "enabled": ${PICOCLAW_HEARTBEAT_ENABLED:-true},
    "interval": ${PICOCLAW_HEARTBEAT_INTERVAL:-30}
  }
}
EOF

echo "Config written to $CONFIG_FILE"
echo "Health endpoint: port ${HEALTH_PORT}"
echo "Gateway: port ${GATEWAY_PORT}"
echo "Provider/Model: ${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}/${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}"

# Start a static health server only if gateway is not bound to Railway's health port.
if [ "${HEALTH_PORT}" != "${GATEWAY_PORT}" ]; then
  mkdir -p /tmp/www /tmp/www/api
  echo '{"ok":true,"status":"healthy"}' > /tmp/www/health.json
  # Also serve root path for platforms that probe "/" by default.
  echo '{"ok":true,"status":"healthy","path":"/"}' > /tmp/www/index.html
  # And serve /health for platforms that probe this conventional route.
  echo '{"ok":true,"status":"healthy","path":"/health"}' > /tmp/www/health
  # Keep compatibility with callers probing /api/status.
  echo '{"ok":true,"status":"healthy","path":"/api/status"}' > /tmp/www/api/status
  httpd -p "${HEALTH_PORT}" -h /tmp/www &
  echo "Health server started on port ${HEALTH_PORT}"
else
  echo "Health server disabled: gateway is bound to the Railway health port (${HEALTH_PORT})"
fi

# TNF Agent Heartbeat - sends status to TNF orchestration worker
AGENT_ID="${TNF_AGENT_ID:-}"
TNF_WORKER_URL="${TNF_WORKER_URL:-https://tnf-agent-orchestration.bizsynth.workers.dev}"
AGENT_ROLE="${TNF_AGENT_ROLE:-unknown}"

if [ -n "$AGENT_ID" ]; then
  echo "Starting TNF heartbeat for agent $AGENT_ID"
  (
    while true; do
      curl -s -X POST "${TNF_WORKER_URL}/agent/heartbeat" \
        -H "Content-Type: application/json" \
        -d "{\"agentId\":\"${AGENT_ID}\",\"status\":\"healthy\",\"currentTask\":\"standing-by\",\"lastActivity\":$(date +%s)000,\"metadata\":{\"role\":\"${AGENT_ROLE}\",\"platform\":\"picoclaw-railway\",\"routingTarget\":\"${ROUTING_TARGET}\",\"provider\":\"${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}\",\"model\":\"${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}\"}}" \
        > /dev/null 2>&1 || true
      sleep 300  # Every 5 minutes
    done
  ) &
  echo "TNF heartbeat started (agent: $AGENT_ID, interval: 5min)"
fi

# Give httpd a moment to bind the port
sleep 1

# Validate provider credentials and attempt automatic provider fallback.
ACTIVE_PROVIDER="${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}"
ACTIVE_MODEL="${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}"

provider_has_key() {
  p="$1"
  case "$p" in
    openai|kilo)
      [ -n "${PICOCLAW_PROVIDERS_OPENAI_API_KEY:-${OPENAI_API_KEY:-${RESOLVED_KILO_API_KEY:-}}}" ] || [ -n "${PICOCLAW_PROVIDERS_KILO_API_KEY:-${RESOLVED_KILO_API_KEY:-}}" ]
      ;;
    openrouter)
      [ -n "${PICOCLAW_PROVIDERS_OPENROUTER_API_KEY:-${OPENROUTER_API_KEY:-}}" ]
      ;;
    anthropic)
      [ -n "${PICOCLAW_PROVIDERS_ANTHROPIC_API_KEY:-${ANTHROPIC_API_KEY:-}}" ]
      ;;
    gemini)
      [ -n "${PICOCLAW_PROVIDERS_GEMINI_API_KEY:-${GEMINI_API_KEY:-}}" ]
      ;;
    groq)
      [ -n "${PICOCLAW_PROVIDERS_GROQ_API_KEY:-${GROQ_API_KEY:-}}" ]
      ;;
    zhipu)
      [ -n "${PICOCLAW_PROVIDERS_ZHIPU_API_KEY:-${ZHIPU_API_KEY:-}}" ]
      ;;
    *)
      [ -n "${PICOCLAW_PROVIDERS_OPENAI_API_KEY:-${OPENAI_API_KEY:-${RESOLVED_KILO_API_KEY:-}}}" ]
      ;;
  esac
}

if ! provider_has_key "${ACTIVE_PROVIDER}"; then
  if provider_has_key openai; then
    ACTIVE_PROVIDER="openai"
  elif provider_has_key openrouter; then
    ACTIVE_PROVIDER="openrouter"
  elif provider_has_key anthropic; then
    ACTIVE_PROVIDER="anthropic"
  elif provider_has_key gemini; then
    ACTIVE_PROVIDER="gemini"
  elif provider_has_key groq; then
    ACTIVE_PROVIDER="groq"
  elif provider_has_key zhipu; then
    ACTIVE_PROVIDER="zhipu"
  else
    echo "No provider API key found; keeping health endpoint alive and skipping gateway startup."
    while true; do sleep 3600; done
  fi
  PICOCLAW_AGENTS_DEFAULTS_PROVIDER="${ACTIVE_PROVIDER}"
  export PICOCLAW_AGENTS_DEFAULTS_PROVIDER
  echo "Auto-switched provider to '${ACTIVE_PROVIDER}' due missing credentials for startup provider."
  if command -v jq >/dev/null 2>&1; then
    tmp_cfg="$(mktemp)"
    jq --arg provider "${PICOCLAW_AGENTS_DEFAULTS_PROVIDER}" '.agents.defaults.provider = $provider' "$CONFIG_FILE" > "$tmp_cfg" && mv "$tmp_cfg" "$CONFIG_FILE"
  fi
fi

WORKSPACE_DIR="/root/.picoclaw/workspace"
MEMORY_DIR="${WORKSPACE_DIR}/memory"
AUTOPILOT_STATUS_FILE="${MEMORY_DIR}/AUTOPILOT_STATUS.json"
AUTOPILOT_INTERVAL_SECONDS="${TNF_AUTOPILOT_INTERVAL_SECONDS:-900}"

now_iso_utc() {
  date -u '+%Y-%m-%dT%H:%M:%SZ'
}

resolve_searxng_base() {
  if [ -n "${SEARXNG_BASE_URL:-}" ]; then
    printf '%s' "${SEARXNG_BASE_URL%/}"
    return
  fi
  if [ -n "${RAILWAY_SERVICE_SEARXNG_URL:-}" ]; then
    printf 'https://%s' "${RAILWAY_SERVICE_SEARXNG_URL}"
    return
  fi
  printf ''
}

discover_free_models_json() {
  models_json="$(curl -fsS --max-time 20 https://openrouter.ai/api/v1/models 2>/dev/null | jq -c '[.data[]? | .id // empty | tostring | select(test(":free$"))] | unique' 2>/dev/null || true)"
  if [ -z "${models_json}" ]; then
    models_json='[]'
  fi
  printf '%s' "${models_json}"
}

write_autopilot_status() {
  mode="$1"
  details_json="$2"
  mkdir -p "${MEMORY_DIR}"
  tmp_status="$(mktemp)"
  jq -cn \
    --arg timestamp "$(now_iso_utc)" \
    --arg mode "${mode}" \
    --arg role "${AGENT_ROLE}" \
    --arg target "${ROUTING_TARGET}" \
    --argjson details "${details_json}" \
    '{timestamp:$timestamp,mode:$mode,role:$role,target:$target,details:$details}' > "${tmp_status}" 2>/dev/null || true
  if [ -s "${tmp_status}" ]; then
    mv "${tmp_status}" "${AUTOPILOT_STATUS_FILE}"
  else
    rm -f "${tmp_status}"
  fi
}

seed_role_heartbeat_template() {
  role_mode="$1"
  hb_file="${WORKSPACE_DIR}/HEARTBEAT.md"
  mkdir -p "${WORKSPACE_DIR}" "${MEMORY_DIR}"

  case "${role_mode}" in
    research)
      cat > "${hb_file}" <<'EOF'
# TNF Discovery Heartbeat

- Read `/root/.picoclaw/workspace/memory/FREE_LLM_DISCOVERY_LATEST.json`.
- Verify it was updated recently (target: < 45 minutes old).
- If stale or missing, append an alert line to `/root/.picoclaw/workspace/memory/AUTOPILOT_ALERTS.md`.
- Do not call hardware tools (i2c/camera/serial).
- Respond with `HEARTBEAT_OK` only when checks complete.
EOF
      ;;
    validator)
      cat > "${hb_file}" <<'EOF'
# TNF Viability Heartbeat

- Read `/root/.picoclaw/workspace/memory/FREE_LLM_VIABILITY_LATEST.json`.
- Verify a best candidate exists and the report is fresh.
- If stale or missing, append an alert line to `/root/.picoclaw/workspace/memory/AUTOPILOT_ALERTS.md`.
- Do not call hardware tools (i2c/camera/serial).
- Respond with `HEARTBEAT_OK` only when checks complete.
EOF
      ;;
    subject)
      cat > "${hb_file}" <<'EOF'
# TNF Subject Heartbeat

- Read `/root/.picoclaw/workspace/memory/SUBJECT_MODEL_SWITCH_LATEST.json`.
- Confirm model-switch test ran recently and includes a provider/model pair.
- If stale or missing, append an alert line to `/root/.picoclaw/workspace/memory/AUTOPILOT_ALERTS.md`.
- Do not call hardware tools (i2c/camera/serial).
- Respond with `HEARTBEAT_OK` only when checks complete.
EOF
      ;;
    *)
      ;;
  esac
}

run_probe() {
  probe_provider="$1"
  probe_model="$2"
  probe_prompt="$3"

  probe_start="$(date +%s)"
  probe_output="$(
    PICOCLAW_AGENTS_DEFAULTS_PROVIDER="${probe_provider}" \
    PICOCLAW_AGENTS_DEFAULTS_MODEL="${probe_model}" \
    /usr/local/bin/picoclaw agent -m "${probe_prompt}" 2>&1 | tr '\n' ' ' | cut -c1-2400
  )"
  probe_exit=$?
  probe_end="$(date +%s)"
  probe_latency=$((probe_end - probe_start))

  probe_success=false
  if [ "${probe_exit}" -eq 0 ]; then
    if printf '%s' "${probe_output}" | grep -Eqi 'LLM call failed|Error: LLM call failed|Status:[[:space:]]*[45][0-9][0-9]'; then
      probe_success=false
    elif printf '%s' "${probe_output}" | grep -Eqi 'Response:[[:space:]]*(SUBJECT_OK|VIABILITY_OK|TEST_OK|TNF_VIABILITY_OK|HEARTBEAT_OK)|(^|[[:space:]])(SUBJECT_OK|VIABILITY_OK|TEST_OK|TNF_VIABILITY_OK|HEARTBEAT_OK)([[:space:]]|$)'; then
      probe_success=true
    fi
  fi

  jq -cn \
    --arg provider "${probe_provider}" \
    --arg model "${probe_model}" \
    --arg outputSample "${probe_output}" \
    --argjson success "${probe_success}" \
    --argjson exitCode "${probe_exit}" \
    --argjson latencySeconds "${probe_latency}" \
    '{provider:$provider,model:$model,success:$success,exitCode:$exitCode,latencySeconds:$latencySeconds,outputSample:$outputSample}'
}

research_autopilot_once() {
  mkdir -p "${MEMORY_DIR}"
  ts="$(now_iso_utc)"
  free_models_json="$(discover_free_models_json)"
  searx_base="$(resolve_searxng_base)"
  search_results_json='[]'

  if [ -n "${searx_base}" ]; then
    tmp_search="$(mktemp)"
    printf '[' > "${tmp_search}"
    first_item=1
    for query in \
      "new free llm api" \
      "free open source llm api tier" \
      "free ai inference api announcement"
    do
      encoded_query="$(printf '%s' "${query}" | jq -sRr @uri 2>/dev/null || printf '%s' "${query}")"
      raw_payload="$(curl -fsS --max-time 20 "${searx_base}/search?q=${encoded_query}&format=json" 2>/dev/null || true)"
      if [ -n "${raw_payload}" ]; then
        item_json="$(printf '%s' "${raw_payload}" | jq -c --arg q "${query}" '{query:$q,results:[.results[]? | {title,url}][:5]}' 2>/dev/null || true)"
        if [ -n "${item_json}" ]; then
          if [ "${first_item}" -eq 0 ]; then
            printf ',' >> "${tmp_search}"
          fi
          printf '%s' "${item_json}" >> "${tmp_search}"
          first_item=0
        fi
      fi
    done
    printf ']' >> "${tmp_search}"
    search_results_json="$(cat "${tmp_search}")"
    rm -f "${tmp_search}"
  fi

  report_json="$(jq -cn \
    --arg timestamp "${ts}" \
    --arg role "${AGENT_ROLE}" \
    --arg target "${ROUTING_TARGET}" \
    --argjson freeModels "${free_models_json}" \
    --argjson searchResults "${search_results_json}" \
    '{timestamp:$timestamp,role:$role,target:$target,freeModels:$freeModels,searchResults:$searchResults}')"

  printf '%s\n' "${report_json}" > "${MEMORY_DIR}/FREE_LLM_DISCOVERY_LATEST.json"
  printf '%s\n' "${report_json}" >> "${MEMORY_DIR}/FREE_LLM_DISCOVERY_LOG.jsonl"

  status_json="$(jq -cn --argjson freeModelCount "$(printf '%s' "${free_models_json}" | jq 'length' 2>/dev/null || echo 0)" '{ok:true,freeModelCount:$freeModelCount}')"
  write_autopilot_status "research" "${status_json}"
}

tester_autopilot_once() {
  mkdir -p "${MEMORY_DIR}"
  ts="$(now_iso_utc)"
  free_models_json="$(discover_free_models_json)"
  max_candidates="${TNF_TESTER_MAX_CANDIDATES:-4}"
  candidate_file="$(mktemp)"
  : > "${candidate_file}"

  if provider_has_key openrouter; then
    printf '%s' "${free_models_json}" | jq -r '.[]' 2>/dev/null | head -n "${max_candidates}" | while IFS= read -r model_name; do
      if [ -n "${model_name}" ]; then
        printf 'openrouter|%s\n' "${model_name}" >> "${candidate_file}"
      fi
    done
  fi

  if provider_has_key openai; then
    printf 'openai|kilo/auto-free\n' >> "${candidate_file}"
  fi

  if ! [ -s "${candidate_file}" ]; then
    printf 'openai|kilo/auto-free\n' > "${candidate_file}"
  fi

  results_file="$(mktemp)"
  printf '[' > "${results_file}"
  first_result=1
  best_latency=-1
  best_probe='null'
  tested_count=0

  while IFS='|' read -r provider_name model_name; do
    if [ -z "${provider_name}" ] || [ -z "${model_name}" ]; then
      continue
    fi
    probe_json="$(run_probe "${provider_name}" "${model_name}" 'Reply exactly TNF_VIABILITY_OK')"
    tested_count=$((tested_count + 1))

    if [ "${first_result}" -eq 0 ]; then
      printf ',' >> "${results_file}"
    fi
    printf '%s' "${probe_json}" >> "${results_file}"
    first_result=0

    probe_success="$(printf '%s' "${probe_json}" | jq -r '.success' 2>/dev/null || echo false)"
    probe_latency="$(printf '%s' "${probe_json}" | jq -r '.latencySeconds' 2>/dev/null || echo 9999)"
    if [ "${probe_success}" = "true" ]; then
      if [ "${best_latency}" -lt 0 ] || [ "${probe_latency}" -lt "${best_latency}" ]; then
        best_latency="${probe_latency}"
        best_probe="${probe_json}"
      fi
    fi
  done < "${candidate_file}"

  printf ']' >> "${results_file}"
  results_json="$(cat "${results_file}")"

  report_json="$(jq -cn \
    --arg timestamp "${ts}" \
    --arg role "${AGENT_ROLE}" \
    --arg target "${ROUTING_TARGET}" \
    --argjson testedCount "${tested_count}" \
    --argjson bestCandidate "${best_probe}" \
    --argjson probeResults "${results_json}" \
    '{timestamp:$timestamp,role:$role,target:$target,testedCount:$testedCount,bestCandidate:$bestCandidate,probeResults:$probeResults}')"

  printf '%s\n' "${report_json}" > "${MEMORY_DIR}/FREE_LLM_VIABILITY_LATEST.json"
  printf '%s\n' "${report_json}" >> "${MEMORY_DIR}/FREE_LLM_VIABILITY_LOG.jsonl"

  status_json="$(jq -cn --argjson testedCount "${tested_count}" --argjson hasBest "$(printf '%s' "${best_probe}" | jq '. != null' 2>/dev/null || echo false)" '{ok:true,testedCount:$testedCount,hasBest:$hasBest}')"
  write_autopilot_status "validator" "${status_json}"

  rm -f "${candidate_file}" "${results_file}"
}

subject_autopilot_once() {
  mkdir -p "${MEMORY_DIR}"
  ts="$(now_iso_utc)"
  max_candidates="${TNF_SUBJECT_MAX_CANDIDATES:-3}"
  free_models_json="$(discover_free_models_json)"
  candidate_file="$(mktemp)"
  : > "${candidate_file}"

  if provider_has_key openrouter; then
    printf '%s' "${free_models_json}" | jq -r '.[]' 2>/dev/null | head -n "${max_candidates}" | while IFS= read -r model_name; do
      if [ -n "${model_name}" ]; then
        printf 'openrouter|%s\n' "${model_name}" >> "${candidate_file}"
      fi
    done
  fi

  if provider_has_key openai; then
    printf 'openai|kilo/auto-free\n' >> "${candidate_file}"
  fi

  if ! [ -s "${candidate_file}" ]; then
    printf 'openai|kilo/auto-free\n' > "${candidate_file}"
  fi

  state_file="${MEMORY_DIR}/SUBJECT_SWITCH_STATE.json"
  next_index=0
  if [ -f "${state_file}" ]; then
    next_index="$(jq -r '.nextIndex // 0' "${state_file}" 2>/dev/null || echo 0)"
  fi
  if [ -z "${next_index}" ]; then
    next_index=0
  fi

  candidate_count="$(wc -l < "${candidate_file}" | tr -d ' ')"
  if [ "${candidate_count}" -le 0 ]; then
    candidate_count=1
  fi

  selected_index=$((next_index % candidate_count))
  selected_line="$(sed -n "$((selected_index + 1))p" "${candidate_file}")"
  selected_provider="$(printf '%s' "${selected_line}" | cut -d'|' -f1)"
  selected_model="$(printf '%s' "${selected_line}" | cut -d'|' -f2-)"

  probe_json="$(run_probe "${selected_provider}" "${selected_model}" 'Reply exactly SUBJECT_OK')"

  next_index=$(((selected_index + 1) % candidate_count))
  printf '{"nextIndex":%s,"updatedAt":"%s"}\n' "${next_index}" "$(now_iso_utc)" > "${state_file}"

  report_json="$(jq -cn \
    --arg timestamp "${ts}" \
    --arg role "${AGENT_ROLE}" \
    --arg target "${ROUTING_TARGET}" \
    --arg provider "${selected_provider}" \
    --arg model "${selected_model}" \
    --argjson probe "${probe_json}" \
    '{timestamp:$timestamp,role:$role,target:$target,selected:{provider:$provider,model:$model},probe:$probe}')"

  printf '%s\n' "${report_json}" > "${MEMORY_DIR}/SUBJECT_MODEL_SWITCH_LATEST.json"
  printf '%s\n' "${report_json}" >> "${MEMORY_DIR}/SUBJECT_MODEL_SWITCH_LOG.jsonl"

  status_json="$(jq -cn --arg provider "${selected_provider}" --arg model "${selected_model}" --argjson success "$(printf '%s' "${probe_json}" | jq '.success' 2>/dev/null || echo false)" '{ok:true,provider:$provider,model:$model,success:$success}')"
  write_autopilot_status "subject" "${status_json}"

  rm -f "${candidate_file}"
}

start_role_autopilot() {
  role_normalized="$(printf '%s' "${AGENT_ROLE}" | tr '[:upper:]' '[:lower:]')"
  target_normalized="$(printf '%s' "${ROUTING_TARGET}" | tr '[:upper:]' '[:lower:]')"

  # Enforce a sane lower bound so background loops are stable.
  if [ "${AUTOPILOT_INTERVAL_SECONDS}" -lt 300 ] 2>/dev/null; then
    AUTOPILOT_INTERVAL_SECONDS=300
  fi

  case "${role_normalized}:${target_normalized}" in
    research:*|*:picoclaw-perplexity)
      seed_role_heartbeat_template research
      (
        while true; do
          research_autopilot_once || true
          sleep "${AUTOPILOT_INTERVAL_SECONDS}"
        done
      ) &
      echo "TNF autopilot: discovery loop started (interval ${AUTOPILOT_INTERVAL_SECONDS}s)"
      ;;
    validator:*|viability-tester:*|*:picoclaw-tester|*:picoclaw-tester-v2|*:openclaw-tester-v3)
      seed_role_heartbeat_template validator
      (
        while true; do
          tester_autopilot_once || true
          sleep "${AUTOPILOT_INTERVAL_SECONDS}"
        done
      ) &
      echo "TNF autopilot: viability loop started (interval ${AUTOPILOT_INTERVAL_SECONDS}s)"
      ;;
    test-target:*|cli_tester:*|*:picoclaw-subject)
      seed_role_heartbeat_template subject
      (
        while true; do
          subject_autopilot_once || true
          sleep "${AUTOPILOT_INTERVAL_SECONDS}"
        done
      ) &
      echo "TNF autopilot: subject-switch loop started (interval ${AUTOPILOT_INTERVAL_SECONDS}s)"
      ;;
    *)
      echo "TNF autopilot: no specialized loop for role='${AGENT_ROLE}' target='${ROUTING_TARGET}'"
      ;;
  esac
}

start_role_autopilot

# Start picoclaw gateway
exec /usr/local/bin/picoclaw gateway
