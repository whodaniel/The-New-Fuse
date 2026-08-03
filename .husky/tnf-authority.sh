#!/usr/bin/env sh
# .husky/tnf-authority.sh
#
# Shared authority check for commit and push, sourced by .husky/pre-commit and
# .husky/pre-push.
#
# docs/core/AGENTS.md:72 requires live operator confirmation for both actions.
# This file exists because that rule was prose, and prose is not a control:
# on 2026-08-03 four commits and one push-and-merge to origin/main happened
# unattended, all passing every content gate untouched, because none of them
# asked who was acting.
#
# WHAT THIS IS NOT
# ----------------
# This is a speed bump, not a security boundary. Three known bypasses:
#   * `HUSKY=0` short-circuits .husky/_/h before any hook body runs
#   * `git commit --no-verify` / `git push --no-verify` skip hooks entirely
#   * TNF_OPERATOR_CONFIRM is a static string; anything that can read this
#     error message can set it. That is not hypothetical — on 2026-08-03 an
#     agent hit the commit gate at 22:30:13 and re-ran with the variable set
#     36 seconds later.
#
# The only durable control is server-side (a pre-receive hook on the remote),
# which cannot be bypassed from a client. Treat this as a tripwire that makes
# unattended writes visible and slightly inconvenient, not as prevention.

TNF_AUDIT_LOG="${TNF_COMMIT_AUDIT_LOG:-${HOME}/.tnf/audit/commit-attempts.jsonl}"
mkdir -p "$(dirname "$TNF_AUDIT_LOG")" 2>/dev/null || true

# Walk the full process ancestry.
#
# The naive `ps -o command= -p $PPID` records only the immediate parent, which
# under husky is the `.husky/_/h` shim re-exec -- useless for attribution. The
# real caller sits several frames up, past git and past one or more shells, so
# capture the whole chain and let a human read it.
_tnf_ancestry() {
  _tnf_p="$1"
  _tnf_chain=""
  _tnf_depth=0
  while [ "${_tnf_p:-0}" -gt 1 ] 2>/dev/null && [ "$_tnf_depth" -lt 9 ]; do
    _tnf_cmd=$(ps -o command= -p "$_tnf_p" 2>/dev/null | tr -d '"\\' | tr '\n' ' ' | cut -c1-90)
    [ -z "$_tnf_cmd" ] && break
    if [ -z "$_tnf_chain" ]; then
      _tnf_chain="$_tnf_cmd"
    else
      _tnf_chain="$_tnf_chain <- $_tnf_cmd"
    fi
    _tnf_p=$(ps -o ppid= -p "$_tnf_p" 2>/dev/null | tr -d ' ')
    _tnf_depth=$((_tnf_depth + 1))
  done
  printf '%s' "$_tnf_chain"
}

# $1 = action ("commit"|"push"), $2 = decision, $3 = free-form detail
_tnf_record() {
  printf '{"ts":"%s","action":"%s","decision":"%s","pid":%s,"tty":"%s","branch":"%s","detail":"%s","ancestry":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" "$$" \
    "$(ps -o tty= -p $$ 2>/dev/null | tr -d ' ' | sed 's|^$|none|')" \
    "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)" \
    "$3" "$(_tnf_ancestry $$)" \
    >>"$TNF_AUDIT_LOG" 2>/dev/null || true
}

# $1 = action ("commit"|"push"), $2 = free-form detail for the log
tnf_require_operator() {
  if [ -z "$TNF_OPERATOR_CONFIRM" ]; then
    _tnf_record "$1" blocked "$2"
    echo "" >&2
    echo "  BLOCKED — $1 requires live operator confirmation." >&2
    echo "  docs/core/AGENTS.md:72" >&2
    echo "" >&2
    echo "  This repo's git identity is shared ($(git config user.email 2>/dev/null))," >&2
    echo "  so authority cannot be inferred from the author. It must be asserted." >&2
    echo "" >&2
    echo "  Operator:  TNF_OPERATOR_CONFIRM=1 git $1 ..." >&2
    echo "  Logged to: $TNF_AUDIT_LOG" >&2
    echo "" >&2
    echo "  If you are an automated agent: this variable is not yours to set." >&2
    echo "  Stop and surface the blocked $1 to the operator instead." >&2
    echo "" >&2
    exit 1
  fi
  _tnf_record "$1" allowed "$2"
}
