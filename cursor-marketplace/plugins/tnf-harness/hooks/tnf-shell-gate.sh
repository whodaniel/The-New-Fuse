#!/usr/bin/env bash
# TNF operator safety gate for Cursor.
# Reads a beforeShellExecution event on stdin and asks for explicit operator
# confirmation before state-changing / destructive / process-killing commands.
#
# Contract (Cursor hooks): emit JSON on stdout with a "permission" of
# "allow" | "ask" | "deny". We use "ask" so the operator confirms in-product,
# matching TNF's per-action, no-fabricated-handshake policy.
set -euo pipefail

payload="$(cat || true)"

# Extract the command string without requiring jq.
command_str=""
if command -v jq >/dev/null 2>&1; then
  command_str="$(printf '%s' "$payload" | jq -r '.command // empty' 2>/dev/null || true)"
fi
if [ -z "$command_str" ]; then
  # Fallback: naive extraction of the "command" field.
  command_str="$(printf '%s' "$payload" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' | head -n 1)"
fi

allow() { printf '{"continue":true,"permission":"allow"}\n'; exit 0; }
ask() {
  local msg="$1"
  printf '{"continue":true,"permission":"ask","user_message":%s,"agent_message":%s}\n' \
    "\"$msg\"" \
    "\"TNF safety gate: this is an operator-gated action. Do not fabricate approval. State exactly what you intend to do and why, then wait for the operator to confirm in this dialog.\""
  exit 0
}

# Nothing to inspect -> allow (fail-open, non-security-critical).
[ -z "$command_str" ] && allow

lc="$(printf '%s' "$command_str" | tr '[:upper:]' '[:lower:]')"

case "$lc" in
  *"git commit"*|*"git push"*|*"git reset --hard"*|*"git clean -"*|*"git rebase"*|*"git cherry-pick"*)
    ask "TNF gate: git state change requested — needs operator confirmation." ;;
  *"pkill "*|*"killall "*|*" kill -9 "*|*"kill -9 "*)
    ask "TNF gate: process kill requested — needs operator confirmation (no fleet culls without a live handshake)." ;;
  *"rm -rf"*|*"rm -fr"*)
    ask "TNF gate: recursive delete requested — needs operator confirmation." ;;
  *"tnf full-auto"*|*"tnf self-improvement"*|*"tnf zero-turn"*|*"tnf super-cycle"*)
    ask "TNF gate: autonomous loop requested — needs operator confirmation." ;;
  *)
    allow ;;
esac
