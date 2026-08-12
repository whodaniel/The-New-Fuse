"""Model resolver for the Sub-Director fleet.

Pipeline (left-to-right):
  local-prefer  : try local server + small model; if unreachable, refuse loudly.
  local-only    : local only; refuse on miss (default for prelaunch dev).
  cloud-ok      : local first, cloud as fallback (paid pass-through).
  cloud-primary : cloud first, local as last-resort (paid pass-through).

The resolver NEVER auto-installs models. The local-bootstrap script does that
under explicit operator authorization (prelaunch: tier=local-only).

Each plan record carries:
  tier        : local | cloud | none
  reason      : short human-readable rationale
  model       : resolved model id (or null)
  endpoint    : resolved HTTP endpoint (or null)
  capability  : the capability the resolver matched (code_generation, infra_audit, etc.)
  est_tokens  : rough request budget (prompt + expected completion)
  est_seconds : rough wall-clock budget for the tier

Worker-side `invoke` is then responsible for the actual network call.
"""

from __future__ import annotations

import os
import sys
import json
import time
import socket
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple

# ----------------------------------------------------------------------------
# Paths + local config
# ----------------------------------------------------------------------------

SUB_DIR                    = os.path.expanduser("~/.tnf/sub-director")
POLICY_FILE                = os.path.join(SUB_DIR, "model-policy.yaml")
LOCAL_SERVER_HEALTH_URL    = "http://127.0.0.1:8081/health"
LOCAL_INFERENCE_URL        = "http://127.0.0.1:8081/v1/chat/completions"
CLOUD_PROVIDERS_ENV        = "OPENROUTER_API_KEY"   # legacy default; see PROVIDER_REGISTRY
ARTIFACT_DIR               = os.path.expanduser("~/.tnf/sub-director/run-artifacts")

# ----------------------------------------------------------------------------
# Provider discovery (added 2026-08-12)
#
# WHY THIS EXISTS
#   This resolver previously knew exactly two endpoints: llama.cpp on :8081 and
#   OpenRouter, via module constants. That was never a design decision — it was
#   a parallel re-implementation of provider selection that TNF already solves
#   in three other places, none of which agree:
#
#     packages/tnf-cli/src/services/provider-config.ts   7 providers (+NVIDIA NIM)
#     scripts/swarm/llm-provider-tester.cjs              9 providers (+Ollama, SambaNova, Moonshot)
#     data/llm-provider-status.json                      LIVE, role-aware allocations
#                                                        (orchestrator / worker / reviewer / subagent)
#
#   The last one is written by the LLM-Provider-Tester agent and already
#   publishes an allocation for the `worker` role — the exact question this
#   file exists to answer. It was simply never read.
#
#   The symptom this caused was subtler than "fewer providers": CODE_MODELS
#   already lists `nvidia/meta/llama-3.3-70b-instruct`, but every cloud
#   candidate was POSTed to OpenRouter's URL, so an NVIDIA model id went to the
#   wrong vendor. The registry knew about multi-provider; the plumbing did not.
#
# WHAT CHANGED
#   Discovery is now data-driven: the live allocation is consulted first, then
#   a static fallback map, then the original constants. Model ids carry their
#   provider as a prefix (`nvidia/...`, `openrouter/...`) and are routed to the
#   matching base URL and API key.
#
# WHAT DID NOT CHANGE
#   The policy gate. `default_tier` and `allow_cloud` in model-policy.yaml
#   remain the operator's authority; this only widens WHICH backends a
#   permitted tier can reach, never whether a tier is permitted.
# ----------------------------------------------------------------------------

# Static fallback, union of the catalogs above. Every entry is OpenAI-compatible
# /v1/chat/completions, which is why one invoke path serves all of them.
PROVIDER_REGISTRY = {
    "openrouter": {"base": "https://openrouter.ai/api/v1/chat/completions",
                   "env": "OPENROUTER_API_KEY"},
    "nvidia":     {"base": "https://integrate.api.nvidia.com/v1/chat/completions",
                   "env": "NVIDIA_API_KEY"},
    "openai":     {"base": "https://api.openai.com/v1/chat/completions",
                   "env": "OPENAI_API_KEY"},
    "groq":       {"base": "https://api.groq.com/openai/v1/chat/completions",
                   "env": "GROQ_API_KEY"},
    "deepseek":   {"base": "https://api.deepseek.com/v1/chat/completions",
                   "env": "DEEPSEEK_API_KEY"},
    "sambanova":  {"base": "https://api.sambanova.ai/v1/chat/completions",
                   "env": "SAMBANOVA_API_KEY"},
    "moonshot":   {"base": "https://api.moonshot.cn/v1/chat/completions",
                   "env": "MOONSHOT_API_KEY"},
}

# TNF's live, role-aware allocation. Relative to this file's repo checkout.
PROVIDER_STATUS_FILE = os.path.expanduser(
    "~/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/data/llm-provider-status.json"
)


def _live_allocation(role: str = "worker") -> Optional[Dict[str, Any]]:
    """Read TNF's published allocation for a role. None when unavailable.

    Never raises: a missing or malformed status file must degrade to the static
    registry, not take the worker down.
    """
    try:
        with open(PROVIDER_STATUS_FILE) as fh:
            data = json.load(fh)
    except Exception:
        return None
    alloc = (data.get("allocations") or {}).get(role) or data.get("bestAvailable")
    if not isinstance(alloc, dict):
        return None
    if not alloc.get("active", True):
        return None
    return alloc


def _provider_of(model_id: str) -> str:
    """Vendor prefix of a model id (`nvidia/meta/llama-3.3` -> `nvidia`)."""
    return model_id.split("/", 1)[0].lower() if "/" in model_id else ""


def _resolve_cloud_endpoint(model_id: str) -> Tuple[Optional[str], Optional[str], str]:
    """Return (endpoint, env_key, reason) for a cloud model id.

    Order: the model's own vendor prefix, then TNF's live worker allocation,
    then the legacy OpenRouter constant. A provider whose key is absent from the
    environment is skipped rather than returned — an endpoint we cannot
    authenticate against is not a usable plan.
    """
    vendor = _provider_of(model_id)
    entry = PROVIDER_REGISTRY.get(vendor)
    if entry and os.environ.get(entry["env"]):
        return entry["base"], entry["env"], f"vendor prefix '{vendor}' with {entry['env']} present"

    alloc = _live_allocation("worker")
    if alloc:
        env_key = alloc.get("envKey")
        url = alloc.get("testUrl")
        if env_key and url and os.environ.get(env_key):
            return url, env_key, f"TNF live allocation for role=worker ({alloc.get('id')})"

    if os.environ.get(CLOUD_PROVIDERS_ENV):
        return (PROVIDER_REGISTRY["openrouter"]["base"], CLOUD_PROVIDERS_ENV,
                "legacy OpenRouter default")

    return None, None, f"no usable provider for '{model_id}' (no API key in environment)"


# ----------------------------------------------------------------------------
# Capability model registry
# ----------------------------------------------------------------------------

CODE_MODELS = {
    # (tier, model-id, endpoint-or-null)
    "local":  ["qwen2.5-coder-1.5b-instruct", "qwen2.5-coder-3b-instruct", "deepseek-coder-1.3b"],
    "cloud":  ["nvidia/meta/llama-3.3-70b-instruct",
               "openrouter/deepseek/deepseek-chat-v3-0324"],
}

INFRA_MODELS = {
    "local":  ["qwen2.5-coder-3b-instruct"],   # audit-shaped tasks, small instruction-follower
    "cloud":  ["nvidia/meta/llama-3.3-70b-instruct",
               "openrouter/anthropic/claude-3.5-sonnet"],
}


# ----------------------------------------------------------------------------
# Policy loader (tiny YAML-like parser to avoid pyyaml dep)
# ----------------------------------------------------------------------------

def _load_policy() -> Dict[str, Any]:
    default = {
        "default_tier":   "local-only",            # prelaunch safety default
        "allow_cloud":    False,                   # operator opt-in via this file
        "local_endpoint": LOCAL_INFERENCE_URL,
        "local_health":   LOCAL_SERVER_HEALTH_URL,
        "max_dwell_sec":  240,                     # per-envelope model budget
    }
    try:
        raw = open(POLICY_FILE).read()
    except FileNotFoundError:
        os.makedirs(SUB_DIR, exist_ok=True)
        with open(POLICY_FILE, "w") as f:
            f.write("# Sub-Director model policy\n"
                    "# Prelaunch: keep default_tier=local-only and allow_cloud=false\n"
                    "default_tier: local-only\n"
                    "allow_cloud: false\n")
        return default

    policy: Dict[str, Any] = dict(default)
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        k, v = line.split(":", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k in {"allow_cloud"}:
            policy[k] = v.lower() in {"true", "1", "yes", "on"}
        elif k in {"default_tier"}:
            policy[k] = v
    return policy


# ----------------------------------------------------------------------------
# Local LLM probe
# ----------------------------------------------------------------------------

def _local_server_reachable(health: str, timeout: float = 0.4) -> Optional[Dict[str, Any]]:
    try:
        with urllib.request.urlopen(health, timeout=timeout) as r:
            if r.status == 200:
                return {"health": health, "status": r.status}
    except (urllib.error.URLError, socket.timeout, ConnectionRefusedError, OSError):
        return None
    return None


def _local_invoke_capable(worker_capabilities: List[str]) -> bool:
    """Worker needs at least one of the capability families we route locally."""
    return any(c in worker_capabilities for c in
               ("code_generation", "infra_audit", "subagent_dispatch_handoff"))


# ----------------------------------------------------------------------------
# Cloud invocation (only when policy explicitly allows it)
# ----------------------------------------------------------------------------

def _cloud_invoke_chat(model: str, prompt: str, timeout: float) -> Tuple[Optional[str], str]:
    # Resolve the model's real vendor rather than assuming OpenRouter. The
    # strip below matters: OpenRouter expects `deepseek/deepseek-chat`, but
    # NVIDIA expects `meta/llama-3.3-70b-instruct` — the `nvidia/` prefix is
    # our routing hint, not part of the vendor's model id.
    endpoint, env_key, why = _resolve_cloud_endpoint(model)
    if not endpoint or not env_key:
        return None, why
    api_key = os.environ.get(env_key)
    if not api_key:
        return None, f"{env_key} not in environment"

    vendor = _provider_of(model)
    wire_model = model
    if vendor and vendor in PROVIDER_REGISTRY and vendor != "openrouter":
        wire_model = model.split("/", 1)[1]

    req_body = json.dumps({
        "model": wire_model,
        "messages": [
            {"role": "system",
             "content": (
                 "You are a hermes-* worker agent operating TNF for Daniel. "
                 "Keep replies concise, structured, and executable.")},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 1024,
        "temperature": 0.2,
        "stream": False,
    }).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=req_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type":  "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            obj = json.loads(r.read().decode("utf-8"))
        choice = obj["choices"][0]["message"]["content"]
        return choice, "ok"
    except (urllib.error.URLError, KeyError, json.JSONDecodeError) as e:
        return None, f"{type(e).__name__}: {e}"


# ----------------------------------------------------------------------------
# Public API
# ----------------------------------------------------------------------------

def resolve(
    agent_id:               str,
    task_text:              str               = "",
    envelope:               Optional[Dict[str, Any]] = None,
    worker_capabilities:    Optional[List[str]] = None,
    policy:                 Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Return the orchestration plan for one envelope."""
    worker_capabilities = worker_capabilities or []
    env_payload = (((envelope or {}).get("payload") or {}).get("payload") or {})
    requested_tier = (
        env_payload.get("preferred_tier")
        or env_payload.get("tier")
        or env_payload.get("model_tier")
        or "default"
    )
    cloud_ok_envelope = bool(env_payload.get("cloud_ok", False))

    policy = policy or _load_policy()
    default_tier = policy.get("default_tier", "local-only")
    tier = (
        requested_tier
        if requested_tier not in {"default", "", None}
        else default_tier
    )
    allow_cloud = bool(policy.get("allow_cloud", False)) or cloud_ok_envelope

    local_ok = bool(_local_server_reachable(policy["local_health"]))

    # Capability-matched model family
    if any(c in worker_capabilities for c in ("code_generation", "drizzle_migration_apply",
                                              "zod_schema_generation")):
        family, model_set = "code", CODE_MODELS
    elif "infra_audit" in worker_capabilities:
        family, model_set = "infra", INFRA_MODELS
    elif _local_invoke_capable(worker_capabilities):
        family, model_set = "general", {"local": ["qwen2.5-coder-1.5b-instruct"],
                                        "cloud": model_set.get("cloud", []) if False else []}
    else:
        family, model_set = "none", {"local": [], "cloud": []}

    def _pick(tier_kind: str) -> Tuple[Optional[str], Optional[str], List[str]]:
        cands = model_set.get(tier_kind) or []
        if not cands:
            return None, None, cands
        if tier_kind == "local" and local_ok:
            return cands[0], policy["local_inference_url"], cands
        if tier_kind == "cloud" and allow_cloud:
            # Walk candidates in preference order and take the first whose
            # vendor we can actually authenticate against. Previously this
            # returned cands[0] against a hardcoded OpenRouter URL, which sent
            # `nvidia/...` ids to the wrong vendor and silently failed.
            for cand in cands:
                ep, env_key, _why = _resolve_cloud_endpoint(cand)
                if ep:
                    return cand, ep, cands
            return None, None, cands
        return None, None, cands

    # actual selection matrix
    if tier == "local-only":
        m, ep, cands = _pick("local")
        chosen_tier = "local" if m else "none"
        reason = ("local server reachable"
                  if (m and chosen_tier == "local")
                  else "no local backend; tier=local-only refuses to escalate")
    elif tier == "local-prefer":
        m, ep, cands = _pick("local")
        chosen_tier = "local" if m else (_pick("cloud")[0] and "cloud" or "none")
        if not m:
            m, ep = _pick("cloud")[:2]
        reason = "local picked" if m == cands[0] and chosen_tier == "local" else (
            "cloud fallback (local unreachable)" if chosen_tier == "cloud" else
            "no backend available"
        )
    elif tier == "cloud-ok":
        m, ep, cands = _pick("local")
        if m:
            chosen_tier = "local"
            reason = "local preferred (cloud-ok but local up)"
        else:
            m, ep, cands = _pick("cloud")
            chosen_tier = "cloud" if m else "none"
            reason = "cloud fallback" if chosen_tier == "cloud" else "no backend available"
    elif tier == "cloud-primary":
        m, ep, cands = _pick("cloud")
        if m:
            chosen_tier = "cloud"; reason = "cloud-primary explicit"
        else:
            m, ep, cands = _pick("local")
            chosen_tier = "local" if m else "none"
            reason = ("local fallback (cloud-primary but cloud refused)"
                      if chosen_tier == "local" else "no backend available")
    else:  # unknown requested, treat as default
        return resolve(agent_id, task_text, envelope, worker_capabilities,
                       {**policy, "default_tier": tier or "local-only"})

    return {
        "agent_id":      agent_id,
        "capability":    family,
        "tier":          chosen_tier,                    # local|cloud|none
        "reason":        reason,
        "model":         m,
        "endpoint":      ep,
        "candidates":    cands,
        "allow_cloud":   allow_cloud,
        "default_tier":  default_tier,
        "max_dwell_sec": policy.get("max_dwell_sec", 240),
        "resolved_at":   time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }


def invoke(
    plan:           Dict[str, Any],
    prompt:         str,
    timeout:        float = 60.0,
) -> Dict[str, Any]:
    """Execute a resolved plan locally or in the cloud."""
    tier = plan.get("tier")
    model = plan.get("model")
    out = {"tier": tier, "model": model, "ok": False, "latency_ms": 0,
           "content": None, "error": None}
    if tier == "none" or not model or not plan.get("endpoint"):
        out["error"] = "no executable plan: " + plan.get("reason", "")
        return out
    t0 = time.time()
    if tier == "local":
        try:
            req_body = json.dumps({
                "model": model, "stream": False, "temperature": 0.2,
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": "You are a hermes worker agent."},
                    {"role": "user",   "content": prompt},
                ],
            }).encode("utf-8")
            req = urllib.request.Request(
                plan["endpoint"], data=req_body,
                headers={"Content-Type": "application/json"}, method="POST",
            )
            with urllib.request.urlopen(req, timeout=timeout) as r:
                obj = json.loads(r.read().decode("utf-8"))
            out["content"] = obj.get("choices", [{}])[0].get("message", {}).get("content")
            out["ok"] = True
        except Exception as e:
            out["error"] = f"{type(e).__name__}: {e}"
    elif tier == "cloud":
        text, err = _cloud_invoke_chat(model, prompt, timeout)
        out["ok"] = bool(text); out["content"] = text; out["error"] = err
    out["latency_ms"] = int((time.time() - t0) * 1000)
    return out


def _self_test():
    policy = _load_policy()
    print("Policy:", json.dumps(policy, indent=2))
    for env in [
        None,
        {"payload": {"payload": {"cloud_ok": True}}},
        {"payload": {"payload": {"preferred_tier": "cloud-primary"}}},
    ]:
        env_obj = env if env else None
        plan = resolve("agent_hermes-codegen-worker_1782364000001",
                       "summarize prompt", env_obj,
                       ["code_generation", "typescript_strict"], policy)
        print(json.dumps(plan, indent=2))
        print("---")


if __name__ == "__main__":
    _self_test()
