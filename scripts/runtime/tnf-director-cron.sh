#!/usr/bin/env bash
set -euo pipefail

LABEL="tnf-director-loop"
TAG="# ${LABEL}"
NODE_BIN="$(command -v node)"
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/tnf-director-loop.cjs"
LOG_DIR="$HOME/.tnf/director/logs"

ensure_dirs() {
  mkdir -p "$LOG_DIR"
}

install_cron() {
  ensure_dirs
  local tmp_cron
  tmp_cron="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" >"$tmp_cron" || true
  echo "*/5 * * * * $NODE_BIN $SCRIPT_PATH >> $LOG_DIR/cron.log 2>&1 $TAG" >>"$tmp_cron"
  crontab "$tmp_cron"
  rm -f "$tmp_cron"
  echo "✅ Installed cron entry for ${LABEL} (Every 5 minutes)"
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
