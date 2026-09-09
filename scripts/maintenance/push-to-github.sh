#!/bin/bash
# RETIRED — this pushed Dockerfile + railway.toml (renamed cloud_runtime.toml)
# to GitHub via the contents API. Railway is retired and that config file has
# been removed, so the `cat cloud_runtime.toml` below could never succeed.
# Refuse honestly rather than fail halfway through a series of API writes.
#
# Use `git push` for normal pushes; scripts/deployment/gcp-deploy.sh to deploy.

set -e

echo "push-to-github.sh is retired (Railway-era: pushed Dockerfile + cloud_runtime.toml)." >&2
echo "Use 'git push', or scripts/deployment/gcp-deploy.sh to deploy." >&2
exit 1

echo "📤 Pushing changes to GitHub via API..."

# Get GitHub token from gh CLI
GH_TOKEN=$(gh auth token 2>/dev/null || echo "")

if [ -z "$GH_TOKEN" ]; then
    echo "❌ GitHub token not found. Please authenticate with: gh auth login"
    exit 1
fi

REPO="whodaniel/The-New-Fuse"
BRANCH="main"

# Read Dockerfile content
DOCKERFILE_CONTENT=$(cat Dockerfile | base64)

# Read cloud_runtime.toml content
CLOUD_RUNTIME_TOML_CONTENT=$(cat cloud_runtime.toml | base64)

# Get current SHA of Dockerfile if it exists
echo "Checking if Dockerfile exists on GitHub..."
DOCKERFILE_SHA=$(gh api repos/$REPO/contents/Dockerfile --jq '.sha' 2>/dev/null || echo "")

# Get current SHA of cloud_runtime.toml
echo "Getting cloud_runtime.toml SHA..."
CLOUD_RUNTIME_SHA=$(gh api repos/$REPO/contents/cloud_runtime.toml --jq '.sha' 2>/dev/null || echo "")

# Create or update Dockerfile
echo "Pushing Dockerfile..."
if [ -z "$DOCKERFILE_SHA" ]; then
    # Create new file
    gh api repos/$REPO/contents/Dockerfile \
        -X PUT \
        -f message="Add root-level Dockerfile for CloudRuntime deployment" \
        -f content="$DOCKERFILE_CONTENT" \
        -f branch="$BRANCH"
else
    # Update existing file
    gh api repos/$REPO/contents/Dockerfile \
        -X PUT \
        -f message="Update Dockerfile for CloudRuntime deployment" \
        -f content="$DOCKERFILE_CONTENT" \
        -f sha="$DOCKERFILE_SHA" \
        -f branch="$BRANCH"
fi

echo "✅ Dockerfile pushed!"

# Update cloud_runtime.toml
echo "Pushing cloud_runtime.toml..."
gh api repos/$REPO/contents/cloud_runtime.toml \
    -X PUT \
    -f message="Update cloud_runtime.toml to use root Dockerfile" \
    -f content="$CLOUD_RUNTIME_TOML_CONTENT" \
    -f sha="$CLOUD_RUNTIME_SHA" \
    -f branch="$BRANCH"

echo "✅ cloud_runtime.toml pushed!"

echo ""
echo "🎉 All changes pushed to GitHub!"
echo "CloudRuntime will now rebuild automatically."
