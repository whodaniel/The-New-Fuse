#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="tnf-terminal-heartbeat-pulse"
TAG="# ${LABEL}"
SERVICE_HOME="$HOME/.tnf/terminal-heartbeat"
BIN_DIR="$SERVICE_HOME/bin"
LOG_DIR="$SERVICE_HOME/logs"
STATE_DIR="$SERVICE_HOME/state"
# Canonical source = repo runtime script. The OLD code used
# $HOME/.tnf/bin/... as both source and destination which is a no-op;
# fix is to read from the repo and mirror to two destinations.
CANONICAL_SCRIPT="${ROOT_DIR}/scripts/runtime/terminal-heartbeat-pulse.cjs"
MIRRORED_SCRIPT="$BIN_DIR/terminal-heartbeat-pulse.cjs"
HOME_BIN_SCRIPT="$HOME/.tnf/bin/terminal-heartbeat-pulse.cjs"
LOG_FILE="$LOG_DIR/cron.log"
NODE_BIN_VALUE="${TNF_TERMINAL_HEARTBEAT_NODE_BIN:-$(command -v node)}"
SCHEDULE_VALUE="${TNF_TERMINAL_HEARTBEAT_CRON_SCHEDULE:-* * * * *}"

ensure_dirs() {
  mkdir -p "$BIN_DIR"
  mkdir -p "$LOG_DIR"
  mkdir -p "$STATE_DIR"
}

# Resolve the canonical repo root from this script's location
# (scripts/runtime/terminal-heartbeat-cron.sh) so we can mirror the
# helper library that ships alongside it. scripts/lib is the layout
# the runtime scripts expect when they `require('../lib/...')`.
#
# There are TWO mirror homes the deployed script can run from (see
# sync_script() below: $BIN_DIR = $SERVICE_HOME/bin, which is what the
# live cron entry actually invokes via $MIRRORED_SCRIPT, and
# $HOME/.tnf/bin, for "ad-hoc shells" per that function's own comment).
# `../lib` relative to each resolves to a DIFFERENT directory
# ($SERVICE_HOME/lib vs $HOME/.tnf/lib) — this function previously only
# synced the latter, so any script requiring a sibling lib module while
# running from $SERVICE_HOME/bin (the real cron path) got
# MODULE_NOT_FOUND unless that lib happened to have a stale copy left
# over from something else. Fixed 2026-07-21 after this broke the live
# cron every minute for scripts/lib/tnf-interactive-safe-mode.cjs and
# scripts/lib/tnf-terminal-attention.cjs immediately after they were
# added — mirror to both homes now, matching sync_script()'s pattern.
REPO_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_LIB_DIR="${REPO_ROOT_DIR}/scripts/lib"
HOME_LIB_DIR="$HOME/.tnf/lib"
SERVICE_LIB_DIR="$SERVICE_HOME/lib"

sync_lib() {
  ensure_dirs
  if [ -d "$REPO_LIB_DIR" ]; then
    mkdir -p "$HOME_LIB_DIR"
    mkdir -p "$SERVICE_LIB_DIR"
    # Mirror any .cjs / .js / .sh that the runtime scripts require from
    # ../lib. Keep this idempotent and silent — we do NOT want boot
    # to fail when scripts/lib is empty (it's optional).
    # NOTE: avoid bash's extglob `*.{a,b}` here — it requires `shopt -s
    # extglob` first, and bash 3.x on older macOS barfs on bare brace
    # expansion. Three explicit loops stay portable.
    for f in "$REPO_LIB_DIR"/*.cjs "$REPO_LIB_DIR"/*.js "$REPO_LIB_DIR"/*.sh; do
      [ -e "$f" ] || continue
      cp -f "$f" "$HOME_LIB_DIR/"
      cp -f "$f" "$SERVICE_LIB_DIR/"
    done
  fi
  # tnf-tmux-inject.cjs resolves ../runtime/tnf-tmux.cjs when mirrored under
  # ~/.tnf/terminal-heartbeat/lib; mirror the helper alongside lib copies.
  local tmux_helper="${REPO_ROOT_DIR}/scripts/runtime/tnf-tmux.cjs"
  if [ -f "$tmux_helper" ]; then
    mkdir -p "$HOME/.tnf/runtime" "$SERVICE_HOME/runtime"
    cp -f "$tmux_helper" "$HOME/.tnf/runtime/tnf-tmux.cjs"
    cp -f "$tmux_helper" "$SERVICE_HOME/runtime/tnf-tmux.cjs"
  fi
}

sync_script() {
  ensure_dirs
  # Mirror the canonical repo script to BOTH known homes so cron
  # (which launches from SERVICE_HOME) and ad-hoc shells (which may
  # invoke ~/.tnf/bin/<x> directly) both get the latest binary.
  if [ ! -f "$CANONICAL_SCRIPT" ]; then
    echo "[terminal-heartbeat-cron] missing canonical script at $CANONICAL_SCRIPT" >&2
    return 1
  fi
  cp "$CANONICAL_SCRIPT" "$MIRRORED_SCRIPT"
  chmod +x "$MIRRORED_SCRIPT"
  mkdir -p "$(dirname "$HOME_BIN_SCRIPT")"
  cp "$CANONICAL_SCRIPT" "$HOME_BIN_SCRIPT"
  chmod +x "$HOME_BIN_SCRIPT"
}

cron_line() {
  # TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION / TNF_INTERACTIVE_SAFE_MODE
  # are set explicitly here because this crontab entry is, today, the only
  # live invocation path for the pulse script (tnf-master-heartbeat-loop.cjs's
  # per-cycle `terminal-heartbeat-cron.sh run-once` call hits an unhandled
  # case branch and no-ops — see git history/plan notes). Without setting
  # these here, the pulse script's new safe-by-default config would silently
  # stop all pulsing, since crontab invocations otherwise get no env vars.
  #
  # D24 — Operator Terminal Inviolability (2026-07-28): default is now
  # ALLOW_PROMPT_INJECTION="false". The pulse types the heartbeat text into
  # the agent's tab without submitting (agent TUI picks it up on next render)
  # and skips the target window if it is currently operator-frontmost.
  # Operators who need the legacy bulk-wake behavior must edit this line to
  # "true" and append a `challenge_rationale` referencing the protocol; the
  # CI guard `scripts/protocols/check-operator-terminal-inviolability.cjs`
  # refuses any new cron entry that flips this flag without one.
  local allow_injection_value="${TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION:-false}"
  if [ "$allow_injection_value" = "true" ]; then
    printf '# challenge_rationale: docs/protocols/CHALLENGE_RATIONALE_LOG.md [2026-08-30] heartbeat prompt injection opt-in (D24 §3.1; tmux shouldInjectTmuxPane gate)\n'
  fi
  printf '%s cd "%s" && PATH="%s:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" NODE_PATH="%s/node_modules:%s/packages/tnf-cli/node_modules" TNF_TERMINAL_HEARTBEAT_STATE_DIR="%s" TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="%s" TNF_INTERACTIVE_SAFE_MODE="false" "%s" "%s" >> "%s" 2>&1 %s\n' \
    "$SCHEDULE_VALUE" \
    "$SERVICE_HOME" \
    "$(dirname "$NODE_BIN_VALUE")" \
    "${REPO_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}" \
    "${REPO_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}" \
    "$STATE_DIR" \
    "$allow_injection_value" \
    "$NODE_BIN_VALUE" \
    "$MIRRORED_SCRIPT" \
    "$LOG_FILE" \
    "$TAG"
}

install_cron() {
  sync_lib
  sync_script
  local tmp_cron
  tmp_cron="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" >"$tmp_cron" || true
  cron_line >>"$tmp_cron"
  crontab "$tmp_cron"
  rm -f "$tmp_cron"
  echo "✅ Installed cron entry for ${LABEL}"
}

remove_cron() {
  local tmp_cron
  tmp_cron="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" >"$tmp_cron" || true
  crontab "$tmp_cron"
  rm -f "$tmp_cron"
  echo "Removed cron entry for ${LABEL}"
}

case "${1:-}" in
  install)
    install_cron
    ;;
  uninstall|remove)
    remove_cron
    ;;
  *)
    cat <<EOF
Usage: $0 <install|uninstall>
EOF
    ;;
esac
