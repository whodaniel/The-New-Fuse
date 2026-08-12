#!/usr/bin/env bash
#
# scripts/runtime/rotate-tnf-logs.sh
#
# Cap TNF runtime logs under ~/.tnf so unbounded services cannot fill the disk.
#
# WHY THIS EXISTS
#   Nothing rotated these. Measured 2026-08-12:
#
#     ~/.tnf/logs/relay-stdout.log                  2.8 GB
#     ~/.tnf/green-coordinator/logs/stdout.log      1.2 GB
#     ~/.tnf/logs/relay-stderr.log                  958 MB
#
#   ~/.tnf reached 6.5 GB and the volume hit 100%, at which point
#   com.tnf.subdirector-autopilot died repeatedly with
#   "ENOSPC: no space left on device" while trying to write its state file. A
#   service was killed by a different service's logging.
#
#   Same shape as the crash-looping WS bridge: unbounded accumulation with no
#   cap. There the array had no ceiling; here the file had none.
#
# TRUNCATION IS IN PLACE, ON PURPose
#   Rotating by `mv` would leave every running service writing to an unlinked
#   inode: the file vanishes from the directory, the space is NOT reclaimed
#   until the process exits, and the log silently stops being readable. Copying
#   the tail back over the original preserves the inode, so writers keep
#   working and the space is actually returned.
#
# Usage:
#   scripts/runtime/rotate-tnf-logs.sh              # apply
#   scripts/runtime/rotate-tnf-logs.sh --dry-run    # report only
#   MAX_MB=50 KEEP_LINES=5000 ... to override

set -uo pipefail

ROOT_DIR="${TNF_LOG_ROOT:-$HOME/.tnf}"
MAX_MB="${MAX_MB:-100}"        # rotate anything larger than this
KEEP_LINES="${KEEP_LINES:-20000}"  # tail retained after truncation
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

[ -d "$ROOT_DIR" ] || { echo "no such log root: $ROOT_DIR" >&2; exit 0; }

total_before=0
total_after=0
rotated=0

# -size uses 1024-byte blocks with `c` suffix for bytes; use megabytes directly.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  bytes=$(wc -c < "$f" 2>/dev/null || echo 0)
  mb=$((bytes / 1024 / 1024))
  total_before=$((total_before + mb))

  if [ "$DRY" -eq 1 ]; then
    echo "  would rotate  ${mb}MB  $f"
    rotated=$((rotated + 1))
    continue
  fi

  tmp="$f.rotating.$$"
  if ! tail -n "$KEEP_LINES" "$f" > "$tmp" 2>/dev/null; then
    echo "  SKIP (tail failed)  $f" >&2
    rm -f "$tmp"
    continue
  fi
  # Truncate in place: preserves the inode every running writer holds open.
  if cat "$tmp" > "$f" 2>/dev/null; then
    rm -f "$tmp"
    after=$(( $(wc -c < "$f" 2>/dev/null || echo 0) / 1024 / 1024 ))
    total_after=$((total_after + after))
    rotated=$((rotated + 1))
    echo "  rotated  ${mb}MB -> ${after}MB  $f"
  else
    echo "  SKIP (write failed)  $f" >&2
    rm -f "$tmp"
  fi
done < <(find "$ROOT_DIR" -type f -name '*.log' -size +"${MAX_MB}"M 2>/dev/null)

if [ "$rotated" -eq 0 ]; then
  echo "  no log over ${MAX_MB}MB under $ROOT_DIR"
elif [ "$DRY" -eq 0 ]; then
  echo "  reclaimed ~$((total_before - total_after))MB across ${rotated} file(s)"
fi
exit 0
