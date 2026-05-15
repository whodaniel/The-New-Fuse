#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
CANONICAL="${TNF_VLIB_CANONICAL:-$HOME/Projects/virtual-library-blueprints}"
MIRROR="${TNF_VLIB_MIRROR:-$PROJECT_ROOT/apps/virtual-library-blueprints}"

APPLY=0
ALLOW_DELETE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1; shift ;;
    --delete) ALLOW_DELETE=1; shift ;;
    *)
      echo "Unknown arg: $1"
      echo "Usage: $0 [--apply] [--delete]"
      exit 2
      ;;
  esac
done

if [[ ! -d "$CANONICAL" ]]; then
  echo "Canonical path missing: $CANONICAL" >&2
  exit 1
fi

if [[ ! -d "$MIRROR" ]]; then
  echo "Mirror path missing: $MIRROR" >&2
  exit 1
fi

RSYNC_ARGS=(
  -avh
  --exclude ".git/"
  --exclude "node_modules/"
  --exclude "dist/"
  --exclude "build/"
  --exclude ".logs/"
  --exclude ".DS_Store"
)

if [[ $APPLY -eq 0 ]]; then
  RSYNC_ARGS+=(--dry-run)
fi

if [[ $ALLOW_DELETE -eq 1 ]]; then
  RSYNC_ARGS+=(--delete)
fi

echo "=== Virtual Library Mirror Sync ==="
echo "Canonical: $CANONICAL"
echo "Mirror:    $MIRROR"
echo "Mode:      $([[ $APPLY -eq 1 ]] && echo APPLY || echo DRY-RUN)"
echo "Delete:    $([[ $ALLOW_DELETE -eq 1 ]] && echo ENABLED || echo DISABLED)"
echo

rsync "${RSYNC_ARGS[@]}" "$CANONICAL" "$MIRROR"

echo
echo "=== Git Heads ==="
CANONICAL_HEAD=$(git -C "${CANONICAL%/}" rev-parse --short HEAD 2>/dev/null || echo "n/a")
MIRROR_HEAD=$(git -C "${MIRROR%/}" rev-parse --short HEAD 2>/dev/null || echo "n/a")
CANONICAL_BRANCH=$(git -C "${CANONICAL%/}" branch --show-current 2>/dev/null || echo "n/a")
MIRROR_BRANCH=$(git -C "${MIRROR%/}" branch --show-current 2>/dev/null || echo "n/a")

echo "Canonical branch/head: $CANONICAL_BRANCH / $CANONICAL_HEAD"
echo "Mirror branch/head:    $MIRROR_BRANCH / $MIRROR_HEAD"

if [[ $APPLY -eq 0 ]]; then
  echo
  echo "Dry-run complete. Re-run with --apply to execute."
fi
