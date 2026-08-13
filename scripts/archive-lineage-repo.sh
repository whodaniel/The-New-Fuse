#!/bin/bash
# Archive a lineage repo after parity PASS and bundle backup.
# Uses GitHub API for ARCHIVED.md (no full clone — disk-safe).
# Usage: ./scripts/archive-lineage-repo.sh fuse-mirror
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SLUG="${1:-}"
TEMPLATE="$MONO_ROOT/docs/lineage/ARCHIVED.md.template"
BUNDLE_DIR="$MONO_ROOT/docs/lineage/bundles"

bundle_for_slug() {
  local slug="$1"
  local primary="$BUNDLE_DIR/${slug}.bundle"
  local alias="$BUNDLE_DIR/${slug}.bundle.alias"
  if [ -f "$primary" ]; then
    echo "$primary"
    return 0
  fi
  if [ -f "$alias" ]; then
    local target
    target="$(cat "$alias")"
    if [ -f "$BUNDLE_DIR/$target" ]; then
      echo "$BUNDLE_DIR/$target"
      return 0
    fi
  fi
  return 1
}

if [ -z "$SLUG" ]; then
  echo "Usage: archive-lineage-repo.sh <repo-slug>" >&2
  exit 1
fi

PARITY="$MONO_ROOT/docs/lineage/REPO_PARITY_${SLUG}.md"
if [ ! -f "$PARITY" ]; then
  echo "Missing parity report: $PARITY" >&2
  exit 1
fi
if ! grep -q 'Verdict: PASS' "$PARITY"; then
  echo "Parity not PASS for $SLUG — refusing to archive" >&2
  exit 1
fi

BUNDLE="$(bundle_for_slug "$SLUG" || true)"
if [ -z "$BUNDLE" ]; then
  echo "Missing bundle backup for $SLUG — run create-lineage-bundle.sh first" >&2
  exit 1
fi

if gh repo view "whodaniel/$SLUG" --json isArchived --jq '.isArchived' | grep -q true; then
  echo "whodaniel/$SLUG is already archived"
  exit 0
fi

BODY_FILE="$(mktemp)"
sed "s/<this-repo>/$SLUG/g; s/<repo-name>/$SLUG/g" "$TEMPLATE" > "$BODY_FILE"
B64="$(base64 < "$BODY_FILE" | tr -d '\n')"
rm -f "$BODY_FILE"

SHA=""
SHA="$(gh api "repos/whodaniel/$SLUG/contents/ARCHIVED.md" --jq '.sha' 2>/dev/null || true)"

if [ -n "$SHA" ] && [ "$SHA" != "null" ]; then
  gh api "repos/whodaniel/$SLUG/contents/ARCHIVED.md" -X PUT \
    -f message="docs: update lineage archive notice" \
    -f content="$B64" \
    -f sha="$SHA" >/dev/null
else
  gh api "repos/whodaniel/$SLUG/contents/ARCHIVED.md" -X PUT \
    -f message="docs: mark repository as lineage archive (preservation-first consolidation)" \
    -f content="$B64" >/dev/null
fi

gh repo archive "whodaniel/$SLUG" --yes
echo "Archived whodaniel/$SLUG (bundle: $(basename "$BUNDLE"))"
