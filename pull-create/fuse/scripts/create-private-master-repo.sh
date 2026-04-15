#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <owner/repo>"
  echo "Example: $0 whodaniel/fuse-master"
  exit 1
fi

REPO_SLUG="$1"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install GitHub CLI first."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login -h github.com"
  exit 1
fi

echo "Creating private repo ${REPO_SLUG}..."
gh repo create "${REPO_SLUG}" --private --confirm

echo "Done."
