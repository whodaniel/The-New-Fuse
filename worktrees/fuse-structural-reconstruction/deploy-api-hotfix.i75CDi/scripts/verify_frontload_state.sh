#!/usr/bin/env bash
set -euo pipefail

ZSHRC="${FRONTLOAD_ZSHRC:-$HOME/.zshrc}"
TNF_DIR="${FRONTLOAD_TNF_DIR:-$HOME/.tnf}"
OPENCLAW_HANDOFF_DIR="${FRONTLOAD_OPENCLAW_HANDOFF_DIR:-$HOME/.openclaw/workspace/handoff}"
REQUIRE_FRONTLOAD_COMMAND="${FRONTLOAD_REQUIRE_COMMAND:-1}"
BEGIN_MARK="# BEGIN TNF FRONTLOAD"
END_MARK="# END TNF FRONTLOAD"
JSON_MODE=0
STATUS=0

for arg in "$@"; do
  case "$arg" in
    --json)
      JSON_MODE=1
      ;;
    -h|--help)
      cat <<'EOF'
Usage: verify_frontload_state.sh [--json]
Environment overrides:
  FRONTLOAD_ZSHRC
  FRONTLOAD_TNF_DIR
  FRONTLOAD_OPENCLAW_HANDOFF_DIR
  FRONTLOAD_REQUIRE_COMMAND (1|0)
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

declare -a CHECKS

record() {
  local name="$1"
  local ok="$2"
  local detail="$3"
  CHECKS+=("$name|$ok|$detail")
  if [[ "$ok" != "true" ]]; then
    STATUS=1
  fi
}

if [[ -f "$ZSHRC" ]]; then
  if grep -qF "$BEGIN_MARK" "$ZSHRC" && grep -qF "$END_MARK" "$ZSHRC"; then
    record "zsh_markers" "true" "$ZSHRC contains frontload markers"
  else
    record "zsh_markers" "false" "$ZSHRC missing frontload markers"
  fi
else
  record "zsh_markers" "false" "$ZSHRC missing"
fi

if [[ "$REQUIRE_FRONTLOAD_COMMAND" == "1" ]]; then
  if command -v tnf-frontload >/dev/null 2>&1; then
    record "frontload_command" "true" "tnf-frontload command present"
  else
    record "frontload_command" "false" "tnf-frontload command missing"
  fi
else
  record "frontload_command" "true" "tnf-frontload command check skipped"
fi

if [[ -x "$TNF_DIR/tnf-status" ]]; then
  record "tnf_status_executable" "true" "$TNF_DIR/tnf-status executable"
else
  record "tnf_status_executable" "false" "$TNF_DIR/tnf-status missing or not executable"
fi

if [[ -x "$TNF_DIR/update-from-latest.sh" ]]; then
  record "cache_regen_executable" "true" "$TNF_DIR/update-from-latest.sh executable"
else
  record "cache_regen_executable" "false" "$TNF_DIR/update-from-latest.sh missing or not executable"
fi

if [[ -f "$TNF_DIR/handoff-current.json" ]]; then
  record "handoff_cache_present" "true" "$TNF_DIR/handoff-current.json present"
else
  record "handoff_cache_present" "false" "$TNF_DIR/handoff-current.json missing"
fi

if [[ -f "$OPENCLAW_HANDOFF_DIR/LATEST.md" ]]; then
  record "latest_md_present" "true" "$OPENCLAW_HANDOFF_DIR/LATEST.md present"
else
  record "latest_md_present" "false" "$OPENCLAW_HANDOFF_DIR/LATEST.md missing"
fi

if [[ "$JSON_MODE" == "1" ]]; then
  CHECKS_SERIALIZED="$(printf '%s\n' "${CHECKS[@]}")"
  export CHECKS_SERIALIZED STATUS
  python3 - <<'PY'
import json
import os

checks = []
for line in os.environ.get('CHECKS_SERIALIZED', '').splitlines():
    if not line:
        continue
    name, ok, detail = line.split('|', 2)
    checks.append({
        "name": name,
        "ok": ok == "true",
        "detail": detail,
    })

print(json.dumps({
    "ok": os.environ.get('STATUS', '1') == '0',
    "checks": checks,
}, separators=(',', ':')))
PY
else
  echo "TNF frontload verification"
  for item in "${CHECKS[@]}"; do
    IFS='|' read -r name ok detail <<< "$item"
    if [[ "$ok" == "true" ]]; then
      echo "OK: $detail"
    else
      echo "WARN: $detail"
    fi
  done
fi

exit "$STATUS"
