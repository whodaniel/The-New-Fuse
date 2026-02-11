#!/usr/bin/env bash
set -euo pipefail

# TNF Launch Gates quick verifier (smoke checks)
# Usage:
#   ./scripts/launch-gates.sh
# Optional env:
#   SHAREDSTATE_BASE=https://tnf-sharedstate.bizsynth.workers.dev
#   RUNTIME_BASE=https://openclaw-runtime.bizsynth.workers.dev

SHAREDSTATE_BASE="${SHAREDSTATE_BASE:-https://tnf-sharedstate.bizsynth.workers.dev}"
RUNTIME_BASE="${RUNTIME_BASE:-https://openclaw-runtime.bizsynth.workers.dev}"

pass=0
fail=0
warn=0

ok()   { echo "✅ $*"; pass=$((pass+1)); }
bad()  { echo "❌ $*"; fail=$((fail+1)); }
info() { echo "ℹ️  $*"; }
wn()   { echo "⚠️  $*"; warn=$((warn+1)); }

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

need curl
need grep

http_ok() {
  local url="$1"
  local code
  code="$(curl -sS -o /tmp/lg_resp.$$ -w "%{http_code}" "$url" || true)"
  if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
    return 0
  fi
  return 1
}

json_contains() {
  local url="$1"
  local needle="$2"
  local body
  body="$(curl -sS "$url" || true)"
  grep -q "$needle" <<<"$body"
}

echo "== TNF Launch Gates Smoke Check =="
info "SharedState: $SHAREDSTATE_BASE"
info "Runtime:     $RUNTIME_BASE"

# Gate 6 baseline: health endpoints
if http_ok "$SHAREDSTATE_BASE/health"; then ok "SharedState /health reachable"; else bad "SharedState /health failed"; fi
if http_ok "$RUNTIME_BASE/health"; then ok "Runtime /health reachable"; else bad "Runtime /health failed"; fi

# SharedState route surface checks
if json_contains "$SHAREDSTATE_BASE/health" '"ok"'; then ok "SharedState health returns ok marker"; else bad "SharedState health missing ok marker"; fi

# Deposit smoke test
DEPOSIT_PAYLOAD='{
  "by":"launch-gates",
  "type":"check",
  "scope":{"runtime":"tnf","agent":"launch-gates"},
  "perm":{"visibility":"team","writeScope":"sharedstate"},
  "refs":[{"kind":"task","ref":"launch-gate-smoke"}],
  "data":{"kind":"launch_gate_probe","ts":"'"$(date -u +%FT%TZ)"'"}
}'

DEPOSIT_RESP="$(curl -sS -X POST "$SHAREDSTATE_BASE/deposit" -H 'content-type: application/json' -d "$DEPOSIT_PAYLOAD" || true)"
if grep -q '"ok"[[:space:]]*:[[:space:]]*true' <<<"$DEPOSIT_RESP"; then
  ok "POST /deposit accepted"
else
  bad "POST /deposit failed"
  echo "Response: $DEPOSIT_RESP"
fi

# Withdraw smoke test
WITHDRAW_PAYLOAD='{"by":"launch-gates","agent":"launch-gates","runtime":"openclaw-runtime","inline":false}'
WITHDRAW_RESP="$(curl -sS -X POST "$SHAREDSTATE_BASE/withdraw" -H 'content-type: application/json' -d "$WITHDRAW_PAYLOAD" || true)"
if grep -q '"ok"[[:space:]]*:[[:space:]]*true' <<<"$WITHDRAW_RESP"; then
  ok "POST /withdraw responds"
else
  wn "POST /withdraw not OK (may be expected if no context exists yet)"
fi

# Static code checks for known blockers (local repo)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_FILE="$REPO_ROOT/cloudflare-openclaw-runtime/src/index.ts"
SHARED_FILE="$REPO_ROOT/cloudflare-sharedstate/src/index.ts"

if grep -q "Echo reply (temporary)" "$RUNTIME_FILE"; then
  bad "Echo stub still present in runtime webhook path"
else
  ok "No temporary echo stub marker found"
fi

if grep -q "naive append: get+put" "$SHARED_FILE"; then
  bad "Naive receipt append still present"
else
  ok "Naive append marker not found"
fi

if grep -q "NOT_IMPLEMENTED" "$SHARED_FILE"; then
  wn "SharedState still returns NOT_IMPLEMENTED for unknown routes (informational)"
fi

echo
echo "== Summary =="
echo "Pass: $pass"
echo "Fail: $fail"
echo "Warn: $warn"

if (( fail > 0 )); then
  echo "NO-GO: One or more critical checks failed."
  exit 2
fi

echo "GO-CANDIDATE: No failing smoke checks. Confirm manual gates in LAUNCH_GATES.md."
