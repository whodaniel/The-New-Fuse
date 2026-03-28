#!/usr/bin/env bash
set -euo pipefail

LABEL="tnf-director-loop"
TAG="# ${LABEL}"
NODE_BIN="${TNF_DIRECTOR_NODE_BIN:-$(command -v node)}"
SCHEDULE_VALUE="${TNF_DIRECTOR_CRON_SCHEDULE:-*/5 * * * *}"
SERVICE_HOME="$HOME/.tnf/director"
BIN_DIR="$SERVICE_HOME/bin"
LOG_DIR="$SERVICE_HOME/logs"
SOURCE_SCRIPT="$HOME/.tnf/bin/tnf-director-loop.cjs"
FALLBACK_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/tnf-director-loop.cjs"
SOURCE_LIB_DIR="$HOME/.tnf/bin/lib"
SOURCE_NODE_MODULES="$HOME/.tnf/bin/node_modules"
MIRRORED_SCRIPT="$BIN_DIR/tnf-director-loop.cjs"
MIRRORED_LIB_DIR="$BIN_DIR/lib"
MIRRORED_NODE_MODULES="$BIN_DIR/node_modules"

ensure_dirs() {
  mkdir -p "$BIN_DIR"
  mkdir -p "$LOG_DIR"
}

resolve_source_script() {
  if [[ -f "$SOURCE_SCRIPT" ]]; then
    printf '%s\n' "$SOURCE_SCRIPT"
  else
    printf '%s\n' "$FALLBACK_SCRIPT"
  fi
}

sync_script() {
  ensure_dirs

  local src_script
  src_script="$(resolve_source_script)"
  cp "$src_script" "$MIRRORED_SCRIPT"
  chmod +x "$MIRRORED_SCRIPT"

  if [[ -d "$SOURCE_LIB_DIR" ]]; then
    rm -rf "$MIRRORED_LIB_DIR"
    cp -R "$SOURCE_LIB_DIR" "$MIRRORED_LIB_DIR"
  else
    rm -rf "$MIRRORED_LIB_DIR"
  fi

  if [[ -e "$SOURCE_NODE_MODULES" ]]; then
    rm -rf "$MIRRORED_NODE_MODULES"
    ln -s "$SOURCE_NODE_MODULES" "$MIRRORED_NODE_MODULES"
  else
    rm -rf "$MIRRORED_NODE_MODULES"
  fi
}

cron_line() {
  printf '%s cd "%s" && PATH="%s:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" "%s" "%s" >> "%s" 2>&1 %s\n' \
    "$SCHEDULE_VALUE" \
    "$SERVICE_HOME" \
    "$(dirname "$NODE_BIN")" \
    "$NODE_BIN" \
    "$MIRRORED_SCRIPT" \
    "$LOG_DIR/cron.log" \
    "$TAG"
}

install_cron() {
  sync_script
  ensure_dirs
  local tmp_cron
  tmp_cron="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" >"$tmp_cron" || true
  cron_line >>"$tmp_cron"
  crontab "$tmp_cron"
  rm -f "$tmp_cron"
  echo "✅ Installed cron entry for ${LABEL} (${SCHEDULE_VALUE})"
}

run_once() {
  sync_script
  PATH="$(dirname "$NODE_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  "$NODE_BIN" "$MIRRORED_SCRIPT"
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
  run-once)
    run_once
    ;;
  *)
    cat <<EOF
Usage: $0 <install|uninstall|run-once>
EOF
    ;;
esac
