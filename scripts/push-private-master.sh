#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="${1:-private-origin}"
BRANCH="${2:-$(git branch --show-current)}"

if ! git remote get-url "${REMOTE_NAME}" >/dev/null 2>&1; then
  echo "Remote '${REMOTE_NAME}' not found."
  echo "Canonical development remote is origin → whodaniel/tnf-monorepo."
  echo "Do not recreate private-origin / old-fuse / split-mirror: those GitHub repos stay archived."
  exit 1
fi

url="$(git remote get-url "${REMOTE_NAME}")"
case "$url" in
  *github.com/whodaniel/fuse.git*|*github.com/whodaniel/fuse-master.git*|*github.com/whodaniel/fuse-mirror.git*)
    echo "REFUSING to push to archived lineage repo: $url"
    exit 1
    ;;
esac

echo "Pushing ${BRANCH} to ${REMOTE_NAME}..."
git push -u "${REMOTE_NAME}" "${BRANCH}"
git push "${REMOTE_NAME}" --tags

echo "Private master push complete."
