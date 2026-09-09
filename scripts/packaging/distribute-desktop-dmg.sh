#!/usr/bin/env bash
# TNF Desktop DMG Distribution Script
# Packages and publishes the pre-built desktop DMG to GitHub Releases for open source distribution.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

APP_DIR="$ROOT_DIR/apps/tauri-desktop"
DMG_DIR="$APP_DIR/src-tauri/target/release/bundle/dmg"

echo "======================================================="
echo "  TNF Desktop DMG Release & Distribution"
echo "======================================================="

# 1. Determine Version
VERSION=$(node -p "require('./apps/tauri-desktop/package.json').version || '4.1.0'")
TAG="v$VERSION-desktop"

echo "🏷️  Release Tag: $TAG (Version: $VERSION)"

# 2. Check for existing DMG or build
DMG_FILE=$(find "$DMG_DIR" -name "*.dmg" 2>/dev/null | head -n 1 || true)

if [ -z "$DMG_FILE" ] || [ ! -f "$DMG_FILE" ]; then
  echo "🔨 No existing DMG found in $DMG_DIR. Building DMG locally..."
  node scripts/packaging/build-tauri-dmg.cjs --skip-install
  DMG_FILE=$(find "$DMG_DIR" -name "*.dmg" 2>/dev/null | head -n 1 || true)
fi

if [ -z "$DMG_FILE" ] || [ ! -f "$DMG_FILE" ]; then
  echo "❌ Failed to locate or build DMG file. Aborting distribution."
  exit 1
fi

echo "📦 Found DMG artifact: $DMG_FILE ($(du -h "$DMG_FILE" | cut -f1))"

# 3. Publish to GitHub Releases via gh CLI
if ! command -v gh &>/dev/null || ! gh auth status &>/dev/null; then
  echo "⚠️  GitHub CLI 'gh' is not authenticated. Cannot publish release directly."
  echo "   You can manually attach $DMG_FILE to a GitHub Release at:"
  echo "   https://github.com/whodaniel/tnf-monorepo/releases/new"
  exit 0
fi

echo "🚀 Uploading DMG to GitHub Release ($TAG)..."
if gh release view "$TAG" &>/dev/null; then
  echo "ℹ️  Release $TAG exists. Uploading/overwriting asset..."
  gh release upload "$TAG" "$DMG_FILE" --clobber
else
  echo "ℹ️  Creating release $TAG and uploading asset..."
  gh release create "$TAG" "$DMG_FILE" \
    --title "The New Fuse Desktop $VERSION" \
    --notes "Pre-built standalone macOS DMG for The New Fuse Desktop. Download and drag to Applications."
fi

RELEASE_URL="https://github.com/whodaniel/tnf-monorepo/releases/download/$TAG/$(basename "$DMG_FILE")"
echo ""
echo "======================================================="
echo "✅ DMG published successfully!"
echo "   Public download link:"
echo "   $RELEASE_URL"
echo "======================================================="
echo ""
