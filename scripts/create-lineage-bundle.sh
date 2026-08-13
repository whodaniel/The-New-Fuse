#!/bin/bash
# Create offline git bundle for a lineage repo before GitHub archival.
# Usage: ./scripts/create-lineage-bundle.sh NexusOrchestrator
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_DIR="$MONO_ROOT/docs/lineage/bundles"
SLUG="${1:-}"

remote_for_slug() {
  case "$1" in
    fuse) echo "https://github.com/whodaniel/The-New-Fuse.git" ;;
    fuse-master) echo "https://github.com/whodaniel/The-New-Fuse-master.git" ;;
    fuse-mirror) echo "https://github.com/whodaniel/The-New-Fuse-mirror.git" ;;
    NexusOrchestrator) echo "https://github.com/whodaniel/NexusOrchestrator.git" ;;
    *) echo "" ;;
  esac
}

if [ -z "$SLUG" ]; then
  echo "Usage: create-lineage-bundle.sh <fuse|fuse-master|fuse-mirror|NexusOrchestrator>" >&2
  exit 1
fi

URL="$(remote_for_slug "$SLUG")"
[ -n "$URL" ] || { echo "Unknown slug: $SLUG" >&2; exit 1; }

mkdir -p "$BUNDLE_DIR"
OUT="$BUNDLE_DIR/${SLUG}.bundle"
MIRROR="/tmp/tnf-bundle-${SLUG}.git"

echo "Creating bundle for $SLUG → $OUT"
rm -rf "$MIRROR"

if ! git clone --mirror "$URL" "$MIRROR" 2>/dev/null; then
  echo "Mirror clone failed; trying full clone fallback..."
  FULL="/tmp/tnf-bundle-${SLUG}-full"
  rm -rf "$FULL"
  git clone "$URL" "$FULL"
  git -C "$FULL" bundle create "$OUT" --all
  rm -rf "$FULL"
else
  git -C "$MIRROR" bundle create "$OUT" --all
  rm -rf "$MIRROR"
fi
ls -lh "$OUT"
echo "Done. Verify: git clone $OUT ${SLUG}-restored"
