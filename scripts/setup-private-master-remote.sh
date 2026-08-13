#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <owner/repo> [remote-name]"
  echo "Example: $0 whodaniel/tnf-monorepo origin"
  exit 1
fi

REPO_SLUG="$1"
case "$REPO_SLUG" in
  whodaniel/fuse|whodaniel/fuse-master|whodaniel/fuse-mirror|*/fuse|*/fuse-master|*/fuse-mirror)
    echo "REFUSING: $REPO_SLUG is an archived lineage snapshot. Leave it archived; do not re-add a write remote."
    echo "Canonical development is whodaniel/tnf-monorepo."
    exit 1
    ;;
esac
REMOTE_NAME="${2:-private-origin}"
REMOTE_URL="https://github.com/${REPO_SLUG}.git"

if git remote get-url "${REMOTE_NAME}" >/dev/null 2>&1; then
  git remote set-url "${REMOTE_NAME}" "${REMOTE_URL}"
  echo "Updated remote '${REMOTE_NAME}' -> ${REMOTE_URL}"
else
  git remote add "${REMOTE_NAME}" "${REMOTE_URL}"
  echo "Added remote '${REMOTE_NAME}' -> ${REMOTE_URL}"
fi

echo "Current remotes:"
git remote -v | rg "^${REMOTE_NAME}|^origin" -n -S || true
