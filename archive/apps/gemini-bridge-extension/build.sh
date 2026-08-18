#!/bin/bash

# Enable strict error handling
set -e

echo "🚀 Building The New Fuse Chrome Extension..."

# --- Setup ---
# Get the directory of this script to run from anywhere
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

DIST_DIR="$SCRIPT_DIR/dist"
SRC_DIR="$SCRIPT_DIR/src"

# --- Dependency Management ---
echo "📦 Checking for dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Node modules not found. Installing dependencies..."
  # Use yarn if yarn.lock exists, otherwise use npm
  if [ -f "yarn.lock" ]; then
    yarn install
  else
    npm install
  fi
else
  echo "Dependencies are already installed."
fi

# --- Cleaning ---
echo "🧹 Cleaning previous build..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"
mkdir -p "$DIST_DIR/icons"

# --- Compiling and Bundling ---
echo "⚙️ Building with Webpack..."
# Use the local webpack binary from node_modules
WEBPACK_BIN="./node_modules/.bin/webpack"

if ! $WEBPACK_BIN --config webpack.config.js --mode production; then
    echo "❌ ERROR: Webpack build failed. Exiting."
    exit 1
fi
echo "Webpack build successful."

# --- Verification ---
echo "🔍 Verifying build output in '$DIST_DIR'..."
MISSING_FILES=0
ESSENTIAL_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "background.js"
    "content.js"
)

# Check for icons
ICON_FILES=(
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

for file in "${ESSENTIAL_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    echo "❌ ERROR: Essential file is missing: $file"
    MISSING_FILES=$((MISSING_FILES + 1))
  else
    echo "✅ Found: $file"
  fi
done

for icon in "${ICON_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$icon" ]; then
    echo "⚠️  WARNING: Icon file is missing: $icon"
    # Icons are not critical for functionality, so we don't increment MISSING_FILES
  else
    echo "✅ Found: $icon"
  fi
done

# Check for optional files that enhance functionality
OPTIONAL_FILES=(
    "options.html"
    "options.js"
    "floatingPanel.html"
    "floatingPanel.js"
)

for file in "${OPTIONAL_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    echo "ℹ️  INFO: Optional file not found: $file"
  else
    echo "✅ Found: $file"
  fi
done

# --- Final Status ---
if [ $MISSING_FILES -gt 0 ]; then
  echo "⚠️ Build process completed with $MISSING_FILES missing essential files. The extension may not work properly."
  exit 1
else
  echo "🎉 Build complete! All essential files are present."
  echo "The extension is ready to be loaded from the '$DIST_DIR' directory."
  echo ""
  echo "🚀 Next steps:"
  echo "  1. Open Chrome and navigate to chrome://extensions/"
  echo "  2. Enable 'Developer mode'"
  echo "  3. Click 'Load unpacked' and select: $DIST_DIR"
fi
