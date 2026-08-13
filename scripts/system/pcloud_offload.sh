#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
WORKSPACE_DIR="${TNF_WORKSPACE_DIR:-$(cd "$REPO_ROOT/.." && pwd)}"

usage() {
  cat <<USAGE
Usage:
  pcloud_offload.sh <pcloud_destination_dir> [--delete-source] [path1 path2 ...]

Examples:
  pcloud_offload.sh "/Volumes/pCloud Drive/My pCloud/Offload-$(date +%F)"
  pcloud_offload.sh "/Volumes/pCloud Drive/My pCloud/Offload-$(date +%F)" --delete-source
  pcloud_offload.sh "/Volumes/pCloud Drive/My pCloud/Offload-$(date +%F)" \
    "\$HOME/Documents/Audio Docs" \
    "\$HOME/mini-omni/checkpoint/lit_model.pth"

Default sources (if none supplied):
  - workspace parent (override via TNF_WORKSPACE_DIR)
  - \$HOME/Documents/CODE - 2024
  - \$HOME/Documents/Audio Docs
  - \$HOME/mini-omni/checkpoint/lit_model.pth
  - \$HOME/Downloads/ai_arcade_poker_assets
USAGE
}

if [[ "${1:-}" == "" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 1
fi

DEST_ROOT="$1"
shift || true
DELETE_SOURCE=false

if [[ "${1:-}" == "--delete-source" ]]; then
  DELETE_SOURCE=true
  shift || true
fi

if [[ ! -d "$DEST_ROOT" ]]; then
  echo "Destination does not exist: $DEST_ROOT"
  echo "Make sure pCloud Drive is mounted and the destination folder exists."
  exit 1
fi

declare -a SOURCES
if [[ "$#" -gt 0 ]]; then
  SOURCES=("$@")
else
  SOURCES=(
    "$WORKSPACE_DIR"
    "$HOME/Documents/CODE - 2024"
    "$HOME/Documents/Audio Docs"
    "$HOME/mini-omni/checkpoint/lit_model.pth"
    "$HOME/Downloads/ai_arcade_poker_assets"
  )
fi

mkdir -p "$DEST_ROOT"

echo "Destination: $DEST_ROOT"
echo "Delete source after verification: $DELETE_SOURCE"

action_failed=0

for src in "${SOURCES[@]}"; do
  if [[ ! -e "$src" ]]; then
    echo "SKIP (missing): $src"
    continue
  fi

  base="$(basename "$src")"
  dest_path="$DEST_ROOT/$base"

  echo "\n==> Copying: $src"
  rsync -aEhv --progress "$src" "$DEST_ROOT/"

  echo "==> Verifying: $src"
  if [[ -d "$src" ]]; then
    diff_out="$(rsync -aEhn --delete "$src/" "$dest_path/" || true)"
    if [[ -n "$diff_out" ]]; then
      echo "VERIFY FAILED (directory differs): $src"
      action_failed=1
      continue
    fi
  else
    src_hash="$(shasum -a 256 "$src" | awk '{print $1}')"
    dest_hash="$(shasum -a 256 "$dest_path" | awk '{print $1}')"
    if [[ "$src_hash" != "$dest_hash" ]]; then
      echo "VERIFY FAILED (hash mismatch): $src"
      action_failed=1
      continue
    fi
  fi

  echo "VERIFY OK: $src"

  if [[ "$DELETE_SOURCE" == true ]]; then
    echo "Deleting source: $src"
    rm -rf "$src"
  fi
done

if [[ "$action_failed" -ne 0 ]]; then
  echo "\nCompleted with verification failures. No source deleted for failed items."
  exit 2
fi

echo "\nCompleted successfully."
if [[ "$DELETE_SOURCE" == false ]]; then
  echo "Run again with --delete-source only after you confirm pCloud upload is fully synced."
fi
