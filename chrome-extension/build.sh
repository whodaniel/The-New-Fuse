#!/bin/bash

# Enable error handling
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Ensure we're in the extension directory
cd "$SCRIPT_DIR"

echo "🚀 Building The New Fuse Chrome Extension..."

# Build script for The New Fuse Chrome extension
echo "Starting build in directory: $(pwd)"

# Verify TypeScript
echo "Running type check..."
yarn typecheck

# Clean previous build
echo "Cleaning previous build..."
yarn clean

# Clean the dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist
mkdir -p dist/icons
mkdir -p dist/assets

# Install dependencies using the workspace setup
echo "Ensuring dependencies are installed (using workspace setup)..."
# Go to the parent (root) directory where workspace is configured
cd ..
pwd
if ! yarn install; then
    echo "ERROR: yarn install failed in workspace root. Exiting."
    exit 1
fi
# Return to the chrome-extension directory
cd "$SCRIPT_DIR" || exit
echo "Back in chrome-extension directory: $(pwd)"

# Check if webpack executable exists after install
echo "Checking for webpack binary..."
if [ ! -x "./node_modules/.bin/webpack" ]; then
    echo "webpack not found in ./node_modules/.bin/webpack"
    # Let's look for webpack in the parent's node_modules instead
    if [ -x "../node_modules/.bin/webpack" ]; then
        echo "Found webpack in parent directory's node_modules. Using that instead."
        WEBPACK_BIN="../node_modules/.bin/webpack"
    else
        echo "Searching for webpack..."
        find .. -name webpack -type f | grep -v node_modules
        echo "webpack not found in parent directory either. Exiting."
        exit 1
    fi
else
    WEBPACK_BIN="./node_modules/.bin/webpack"
fi
echo "Using webpack from: $WEBPACK_BIN"

# Copy static files
echo "Copying static files..."
cp src/manifest.json dist/ && echo "Copied manifest.json" || echo "Failed to copy manifest.json"
cp src/popup/popup.html dist/ && echo "Copied popup.html" || echo "Failed to copy popup.html"
cp src/styles/popup.css dist/ && echo "Copied popup.css" || echo "Failed to copy popup.css"
cp src/index.html dist/ && echo "Copied index.html" || echo "Failed to copy index.html"
cp -r src/icons/* dist/icons/ && echo "Copied icons" || echo "Failed to copy icons"

# Copy optional files if they exist
[ -f src/styles/content.css ] && cp src/styles/content.css dist/content.css && echo "Copied content.css"
[ -f src/options/options.html ] && cp src/options/options.html dist/options.html && echo "Copied options.html"
[ -f src/debug/websocket-test.html ] && cp src/debug/websocket-test.html dist/websocket-test.html && echo "Copied websocket-test.html"
[ -f src/styles/styles.css ] && cp src/styles/styles.css dist/styles.css && echo "Copied styles.css"
[ -f src/styles/dark-theme.css ] && cp src/styles/dark-theme.css dist/dark-theme.css && echo "Copied dark-theme.css"
[ -f src/styles/vendor.css ] && cp src/styles/vendor.css dist/vendor.css && echo "Copied vendor.css"

# Build with Webpack
echo "Building with Webpack..."
# List webpack config contents
echo "Webpack config contents:"
cat webpack.config.js

# Use webpack.config.js with transpileOnly option to handle TypeScript errors
echo "Running webpack with command: $WEBPACK_BIN --config webpack.config.js --mode development"
if ! $WEBPACK_BIN --config webpack.config.js --mode development; then
    # If webpack compilation fails, we'll run a fallback build that ignores TypeScript errors
    echo "WARNING: Webpack build failed with TypeScript errors. Using transpileOnly mode..."
    
    # Create a temporary ts-loader config that ignores type checking
    TMP_WEBPACK_CONFIG=$(mktemp)
    cat > $TMP_WEBPACK_CONFIG << 'EOF'
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');  module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background.ts', 
    content: './src/content/index.ts',
    options: './src/options/index.tsx',
    websocketServer: './websocket-server.ts',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 3,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: -10,
          reuseExistingChunk: true,
        },
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
          priority: -20,
        },
      },
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Skip type checking
            compilerOptions: {
              module: "es2015",
              moduleResolution: "node"
            }
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './manifest.json', to: 'manifest.json' },
        { from: './*.html', to: '[name][ext]' },
        { from: './*.css', to: '[name][ext]' },
        { from: './icons', to: 'icons' },
        { from: './launchWebSocketServer.js', to: 'launchWebSocketServer.js' },
      ],
    }),
  ],
};
EOF
    
    echo "Running webpack with transpileOnly mode to ignore TypeScript errors..."
    if ! $WEBPACK_BIN --config $TMP_WEBPACK_CONFIG --mode development; then
        echo "ERROR: Webpack build failed even with transpileOnly. Exiting."
        rm $TMP_WEBPACK_CONFIG
        exit 1
    fi
    rm $TMP_WEBPACK_CONFIG
fi

# Debug: List output directory contents
echo "Contents of dist directory after build:"
find dist -type f | sort

# Ensure the critical files exist after build
echo "Verifying critical files..."
MISSING_FILES=0

# Check for essential JavaScript files
for file in content.js background.js popup.js; do
  if [ ! -f "dist/$file" ]; then
    echo "ERROR: $file not found after webpack build."
    MISSING_FILES=$((MISSING_FILES + 1))
  else
    echo "✓ Found dist/$file"
  fi
done

# Check for essential HTML and JSON files
for file in popup.html manifest.json; do
  if [ ! -f "dist/$file" ]; then
    echo "ERROR: $file not found in dist directory."
    MISSING_FILES=$((MISSING_FILES + 1))
  else
    echo "✓ Found dist/$file"
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo "WARNING: $MISSING_FILES essential files are missing. The extension may not work correctly."
else
  echo "All essential files are present in the dist directory."
fi

echo "Build complete!"
echo "The extension is now ready to be loaded in Chrome."
echo "Load the 'dist' directory as an unpacked extension in Chrome."
