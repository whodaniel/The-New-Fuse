#!/bin/bash
# Push Dockerfile and railway.toml changes to GitHub using API

set -e

echo "📤 Pushing changes to GitHub via API..."

# Get GitHub token from gh CLI
GH_TOKEN=$(gh auth token 2>/dev/null || echo "")

if [ -z "$GH_TOKEN" ]; then
    echo "❌ GitHub token not found. Please authenticate with: gh auth login"
    exit 1
fi

REPO="whodaniel/fuse"
BRANCH="main"

# Read Dockerfile content
DOCKERFILE_CONTENT=$(cat Dockerfile | base64)

# Read railway.toml content
RAILWAY_TOML_CONTENT=$(cat railway.toml | base64)

# Get current SHA of Dockerfile if it exists
echo "Checking if Dockerfile exists on GitHub..."
DOCKERFILE_SHA=$(gh api repos/$REPO/contents/Dockerfile --jq '.sha' 2>/dev/null || echo "")

# Get current SHA of railway.toml
echo "Getting railway.toml SHA..."
RAILWAY_SHA=$(gh api repos/$REPO/contents/railway.toml --jq '.sha' 2>/dev/null || echo "")

# Create or update Dockerfile
echo "Pushing Dockerfile..."
if [ -z "$DOCKERFILE_SHA" ]; then
    # Create new file
    gh api repos/$REPO/contents/Dockerfile \
        -X PUT \
        -f message="Add root-level Dockerfile for Railway deployment" \
        -f content="$DOCKERFILE_CONTENT" \
        -f branch="$BRANCH"
else
    # Update existing file
    gh api repos/$REPO/contents/Dockerfile \
        -X PUT \
        -f message="Update Dockerfile for Railway deployment" \
        -f content="$DOCKERFILE_CONTENT" \
        -f sha="$DOCKERFILE_SHA" \
        -f branch="$BRANCH"
fi

echo "✅ Dockerfile pushed!"

# Update railway.toml
echo "Pushing railway.toml..."
gh api repos/$REPO/contents/railway.toml \
    -X PUT \
    -f message="Update railway.toml to use root Dockerfile" \
    -f content="$RAILWAY_TOML_CONTENT" \
    -f sha="$RAILWAY_SHA" \
    -f branch="$BRANCH"

echo "✅ railway.toml pushed!"

echo ""
echo "🎉 All changes pushed to GitHub!"
echo "Railway will now rebuild automatically."
