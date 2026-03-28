#!/usr/bin/env bash
set -euo pipefail

LABEL="${1:?label argument required}"
ROOT_DIR="${2:?root_dir argument required}"
COMMAND="${3:?command argument required}"
LOG_DIR="${4:-$HOME/.tnf/service-logs/$LABEL}"
DIAG_FILE="${LOG_DIR}/launchd-wrapper.log"

mkdir -p "$LOG_DIR"

{
  printf '[%s] launchd wrapper start label=%s pid=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$LABEL" "$$"
  printf 'root_dir=%s\n' "$ROOT_DIR"
  printf 'command=%s\n' "$COMMAND"
  printf 'uid=%s gid=%s user=%s\n' "$(id -u)" "$(id -g)" "$(id -un)"
  printf 'home=%s\n' "${HOME:-}"
  printf 'shell=%s\n' "${SHELL:-}"
  printf 'path=%s\n' "${PATH:-}"
} >>"$DIAG_FILE" 2>&1

export HOME="${HOME:-/Users/$(id -un)}"
export USER="${USER:-$(id -un)}"
export LOGNAME="${LOGNAME:-$USER}"

if [[ -n "${PATH:-}" ]]; then
  case ":$PATH:" in
    *":$HOME/bin:"*) ;;
    *) PATH="$HOME/bin:$PATH" ;;
  esac
else
  PATH="$HOME/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
fi
export PATH

cd "$ROOT_DIR"
exec /bin/bash -lc "$COMMAND"
