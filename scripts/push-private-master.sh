#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="${1:-private-origin}"
BRANCH="${2:-$(git branch --show-current)}"

if ! git remote get-url "${REMOTE_NAME}" >/dev/null 2>&1; then
  echo "Remote '${REMOTE_NAME}' not found."
  echo "Run: ./scripts/setup-private-master-remote.sh <owner/repo> ${REMOTE_NAME}"
  exit 1
fi

echo "Pushing ${BRANCH} to ${REMOTE_NAME}..."
git push -u "${REMOTE_NAME}" "${BRANCH}"
git push "${REMOTE_NAME}" --tags

echo "Private master push complete."
