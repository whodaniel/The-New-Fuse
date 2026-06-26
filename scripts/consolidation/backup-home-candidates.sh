#!/bin/bash
# Backup home-directory cleanup candidates to cloud-synced storage.
# DOES NOT DELETE ANYTHING. Dry-run by default; --apply creates archives.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST="$MONO_ROOT/docs/consolidation/home-cleanup-candidates.manifest"
DATE_STAMP="$(date +%Y-%m-%d_%H%M%S)"
APPLY=0
DEST=""

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --dest)
      shift
      DEST="${1:-}"
      ;;
    --help|-h)
      echo "Usage: backup-home-candidates.sh [--apply] [--dest PATH]"
      echo ""
      echo "Default dest: ~/pCloud Drive/TNF-Home-Backups/<timestamp>/"
      echo "              or ~/Library/Mobile Documents/com~apple~CloudDocs/TNF-Home-Backups/<timestamp>/"
      exit 0
      ;;
  esac
done

pick_default_dest() {
  local base
  for base in \
    "$HOME/pCloud Drive/TNF-Home-Backups" \
    "$HOME/Library/Mobile Documents/com~apple~CloudDocs/TNF-Home-Backups"; do
    if [[ -d "$(dirname "$base")" ]]; then
      mkdir -p "$base"
      printf '%s/%s\n' "$base" "$DATE_STAMP"
      return 0
    fi
  done
  printf '%s/TNF-Home-Backups/%s\n' "$HOME/Desktop" "$DATE_STAMP"
}

if [[ -z "$DEST" ]]; then
  DEST="$(pick_default_dest)"
fi

echo "TNF safe home backup"
echo "Manifest: $MANIFEST"
echo "Destination: $DEST"
echo "Mode: $([[ $APPLY -eq 1 ]] && echo APPLY || echo dry-run)"
echo ""

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing manifest: $MANIFEST" >&2
  exit 1
fi

if [[ $APPLY -eq 1 ]]; then
  mkdir -p "$DEST"
fi

MANIFEST_JSON="$DEST/manifest-summary.json"
: > /tmp/tnf_backup_paths.$$
BACKED=0
SKIPPED=0

while IFS='|' read -r path tier notes; do
  [[ -z "${path:-}" || "$path" =~ ^# ]] && continue
  path="${path%%#*}"
  path="$(echo "$path" | xargs)"
  tier="$(echo "${tier:-}" | xargs)"
  notes="$(echo "${notes:-}" | xargs)"

  if [[ ! -e "$path" ]]; then
    echo "MISSING  [$tier] $path"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Never auto-archive the whole monorepo or huge runtimes from this script
  case "$tier" in
    RUNTIME)
      echo "SKIP     [$tier] $path — runtime (listed for inventory only)"
      SKIPPED=$((SKIPPED + 1))
      continue
      ;;
  esac

  safe_name="$(echo "$path" | sed 's|^/||' | tr '/' '_')"
  archive="$DEST/${safe_name}.tar.gz"
  checksum="$DEST/${safe_name}.sha256"

  if [[ $APPLY -eq 0 ]]; then
    echo "WOULD    [$tier] $path"
    echo "         -> $archive"
    BACKED=$((BACKED + 1))
    continue
  fi

  echo "ARCHIVE  [$tier] $path"
  tar -czf "$archive" -C / "$(echo "$path" | sed 's|^/||')" 2>/dev/null || {
    # file not directory-safe: archive parent
    parent="$(dirname "$path")"
    base="$(basename "$path")"
    tar -czf "$archive" -C "$parent" "$base"
  }
  shasum -a 256 "$archive" > "$checksum"
  echo "path=$path|tier=$tier|archive=$(basename "$archive")|sha256=$(awk '{print $1}' "$checksum")" >> /tmp/tnf_backup_paths.$$
  BACKED=$((BACKED + 1))
done < "$MANIFEST"

if [[ $APPLY -eq 1 ]]; then
  {
    echo "{"
    echo "  \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
    echo "  \"destination\": \"$DEST\","
    echo "  \"backed_up\": $BACKED,"
    echo "  \"skipped\": $SKIPPED,"
    echo "  \"entries\": ["
    first=1
    while IFS= read -r line; do
      path="${line%%|*}"; rest="${line#*|}"
      tier="${rest#tier=}"; tier="${tier%%|*}"
      archive="${rest#*archive=}"; archive="${archive%%|*}"
      sha="${rest#*sha256=}"
      [[ $first -eq 1 ]] || echo ","
      first=0
      printf '    {"path": "%s", "tier": "%s", "archive": "%s", "sha256": "%s"}' \
        "$path" "$tier" "$archive" "$sha"
    done < /tmp/tnf_backup_paths.$$
    echo ""
    echo "  ]"
    echo "}"
  } > "$MANIFEST_JSON"
  rm -f /tmp/tnf_backup_paths.$$
  echo ""
  echo "Done. $BACKED archives written to:"
  echo "  $DEST"
  echo "Summary: $MANIFEST_JSON"
else
  rm -f /tmp/tnf_backup_paths.$$
  echo ""
  echo "Dry-run: $BACKED paths would be archived, $SKIPPED skipped."
  echo "Re-run with --apply to write to cloud-synced folder."
fi
