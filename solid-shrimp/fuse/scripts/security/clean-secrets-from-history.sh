#!/bin/bash
set -e

# CRITICAL SECURITY: Remove secrets from git history
# WARNING: This rewrites git history. All collaborators must re-clone after this runs.

echo "🚨 CRITICAL SECURITY CLEANUP"
echo "=============================="
echo ""
echo "This script will remove sensitive files from git history."
echo "WARNING: This REWRITES git history!"
echo ""
echo "Before running:"
echo "1. ✅ ROTATE all exposed API keys"
echo "2. ✅ Notify all collaborators"
echo "3. ✅ Backup your repository"
echo ""
read -p "Have you completed the above steps? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. Please complete prerequisite steps first."
    exit 1
fi

echo ""
echo "Installing git-filter-repo if needed..."
if ! command -v git-filter-repo &> /dev/null; then
    pip3 install git-filter-repo
fi

echo ""
echo "🔍 Files to remove from history:"
echo "  - service-account-key.json"
echo "  - firebase-credentials.json"
echo "  - tools/legacy-files/firebase-credentials.json.removed"
echo ""

# Remove specific files from entire git history
git filter-repo --force \
  --path service-account-key.json --invert-paths \
  --path firebase-credentials.json --invert-paths \
  --path tools/legacy-files/firebase-credentials.json.removed --invert-paths

echo ""
echo "✅ Secrets removed from git history!"
echo ""
echo "Next steps:"
echo "1. Review the cleaned history: git log --oneline"
echo "2. Force push to GitHub: git push --force --all origin"
echo "3. All collaborators must: git clone [repo] (fresh clone)"
echo ""
echo "⚠️  DO NOT proceed until ALL API keys have been rotated!"
