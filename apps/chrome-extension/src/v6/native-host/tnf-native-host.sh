#!/bin/bash
# Fuse Connect native messaging launcher.
# Chrome launches hosts with a sparse PATH (/usr/bin:/bin:/usr/sbin:/sbin),
# so `#!/usr/bin/env node` fails. This wrapper resolves Node explicitly.

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$DIR/tnf-native-host.cjs"
LOG_FILE="${HOME}/.tnf-native-host.log"

log() {
  printf '[%s] launcher: %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$*" >>"$LOG_FILE" 2>/dev/null || true
}

resolve_node() {
  if [[ -n "${TNF_NODE_BIN:-}" && -x "${TNF_NODE_BIN}" ]]; then
    printf '%s\n' "$TNF_NODE_BIN"
    return 0
  fi

  local candidate
  for candidate in \
    /usr/local/bin/node \
    /opt/homebrew/bin/node \
    "${HOME}/.hermes/node/bin/node" \
    "${HOME}/.local/bin/node" \
    "${HOME}/.nvm/current/bin/node"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  # nvm versioned installs
  if [[ -d "${HOME}/.nvm/versions/node" ]]; then
    candidate="$(ls -1d "${HOME}"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -1 || true)"
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi

  # Login-shell PATH (Chrome doesn't inherit it)
  candidate="$(/bin/bash -lc 'command -v node' 2>/dev/null || true)"
  if [[ -n "$candidate" && -x "$candidate" ]]; then
    printf '%s\n' "$candidate"
    return 0
  fi

  return 1
}

if [[ ! -f "$SCRIPT" ]]; then
  log "missing host script: $SCRIPT"
  echo "tnf-native-host: missing $SCRIPT" >&2
  exit 127
fi

NODE_BIN="$(resolve_node || true)"
if [[ -z "${NODE_BIN}" ]]; then
  log "node not found under Chrome PATH; install Node or set TNF_NODE_BIN"
  echo "tnf-native-host: node executable not found" >&2
  exit 127
fi

# Ensure pnpm and common bins are available for service start actions.
export PATH="$(dirname "$NODE_BIN"):/usr/local/bin:/opt/homebrew/bin:${HOME}/Library/pnpm:${PATH:-/usr/bin:/bin}"
if [[ -z "${PNPM_BIN:-}" ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    export PNPM_BIN="$(command -v pnpm)"
  fi
fi

exec "$NODE_BIN" "$SCRIPT" "$@"
