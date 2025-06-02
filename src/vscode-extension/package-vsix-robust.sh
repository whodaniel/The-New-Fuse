#!/usr/bin/env bash
set -euo pipefail

echo "📦 Packaging The New Fuse Extension (Robust Script)..."
BASE_DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "SCRIPT_DEBUG: Current directory is \$BASE_DIR. Ensuring script operates from here."
cd "\$BASE_DIR"

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in \$BASE_DIR. This script must be run from the root of the vscode-extension project (e.g., src/vscode-extension/)."
    exit 1
fi
echo "✅ Found package.json in current directory."

echo "Ensuring Corepack is enabled (for Yarn)..."
corepack enable || echo "⚠️  Failed to enable corepack. Continuing, assuming Yarn is otherwise available."

echo "1️⃣ Checking for vsce (Visual Studio Code Extension CLI)..."
if ! command -v vsce &> /dev/null; then
    echo "⚠️  vsce not found. Attempting to install globally via npm..."
    if ! npm install -g @vscode/vsce; then
        echo "❌ Failed to install vsce. Please ensure npm is working or install vsce manually."
        exit 1
    fi
    echo "✅ vsce installed successfully via npm."
else
    echo "✅ vsce is already installed."
fi

echo "2️⃣ Installing dependencies using Yarn..."
if ! yarn install; then
    echo "❌ Failed to install dependencies using Yarn. Check Yarn/Corepack setup and project dependencies."
    # Attempt to clean and reinstall as a fallback
    echo "   Attempting 'yarn cache clean && yarn install' as a fallback..."
    yarn cache clean && yarn install
    if [ \$? -ne 0 ]; then
        echo "❌ Fallback 'yarn cache clean && yarn install' also failed."
        exit 1
    fi
fi
echo "✅ Dependencies installed successfully using Yarn."

echo "3️⃣ Building extension..."
BUILD_SUCCESSFUL=false
# Check if 'compile' script exists in package.json
if grep -q '"compile":' package.json; then
    echo "   Found 'compile' script. Attempting 'yarn run compile'..."
    if yarn run compile; then
        echo "✅ Build successful with 'yarn run compile'."
        BUILD_SUCCESSFUL=true
    else
        echo "⚠️  'yarn run compile' failed."
    fi
else
    echo "⚠️  'compile' script not found in package.json."
fi

if [ "\$BUILD_SUCCESSFUL" = false ]; then
    echo "   Attempting direct TypeScript compilation with 'npx tsc -p ./'..."
    if npx tsc -p ./; then
        echo "✅ Build successful with 'npx tsc -p ./'. (Output should be in 'dist/' as per tsconfig.json)"
        BUILD_SUCCESSFUL=true
    else
        echo "⚠️  Direct 'npx tsc -p ./' failed."
    fi
fi

if [ "\$BUILD_SUCCESSFUL" = false ]; then
    echo "   All primary build methods failed. Attempting fallback build with esbuild..."
    ESBUILD_OUTFILE="./dist/extension.js"
    # Ensure dist directory exists for esbuild output
    mkdir -p ./dist
    if npx esbuild ./src/extension.ts --bundle "--outfile=\$ESBUILD_OUTFILE" --format=cjs --platform=node --external:vscode --allow-overwrite; then
        echo "✅ Fallback build with esbuild completed. Output: \$ESBUILD_OUTFILE"
        BUILD_SUCCESSFUL=true
        # If esbuild fallback is used, ensure package.json main points to it
        if ! grep -q "\"main\": \"\$ESBUILD_OUTFILE\"" package.json; then
            echo "⚠️  Updating package.json 'main' entry to \$ESBUILD_OUTFILE for esbuild output."
            sed -i.bak "s#\"main\": \".*\"#\"main\": \"\$ESBUILD_OUTFILE\"#" package.json && rm -f package.json.bak
            echo "✅ package.json 'main' updated."
        fi
    else
        echo "❌ Fallback build with esbuild also failed. Cannot proceed with packaging."
        exit 1
    fi
fi

if [ "\$BUILD_SUCCESSFUL" = false ]; then
    echo "❌ All build attempts failed. Exiting."
    exit 1
fi

# Verify main entry point file exists
MAIN_ENTRY_FROM_PACKAGE_JSON=\$(grep '"main":' package.json | sed -n 's/.*"main": "\(.*\)",/\1/p' | tr -d '[:space:]')
echo "ℹ️ Expected main entry from package.json: '\$MAIN_ENTRY_FROM_PACKAGE_JSON'"
if [ ! -f "\$MAIN_ENTRY_FROM_PACKAGE_JSON" ]; then
    echo "❌ CRITICAL: Main entry file '\$MAIN_ENTRY_FROM_PACKAGE_JSON' (from package.json) not found after build!"
    echo "   Please check your build process (tsc/esbuild) and tsconfig.json outDir."
    echo "   Listing contents of ./dist/ and ./out/ (if they exist):"
    ls -la ./dist || echo "   ./dist does not exist or is empty."
    ls -la ./out || echo "   ./out does not exist or is empty."
    
    # Attempt to find it in common alternative locations
    if [ -f "./dist/extension.js" ] && [ "\$MAIN_ENTRY_FROM_PACKAGE_JSON" != "./dist/extension.js" ]; then
        echo "⚠️  Found './dist/extension.js'. package.json main is '\$MAIN_ENTRY_FROM_PACKAGE_JSON'. Updating package.json for this packaging attempt."
        sed -i.bak 's#"main": ".*"#"main": "./dist/extension.js"#' package.json && rm -f package.json.bak
        MAIN_ENTRY_FROM_PACKAGE_JSON="./dist/extension.js"
        echo "✅ package.json 'main' updated to './dist/extension.js'."
    elif [ -f "./out/extension.js" ] && [ "\$MAIN_ENTRY_FROM_PACKAGE_JSON" != "./out/extension.js" ]; then
        echo "⚠️  Found './out/extension.js'. package.json main is '\$MAIN_ENTRY_FROM_PACKAGE_JSON'. Updating package.json for this packaging attempt."
        sed -i.bak 's#"main": ".*"#"main": "./out/extension.js"#' package.json && rm -f package.json.bak
        MAIN_ENTRY_FROM_PACKAGE_JSON="./out/extension.js"
        echo "✅ package.json 'main' updated to './out/extension.js'."
    else
        echo "❌ Could not find a suitable main entry file. Exiting."
        exit 1
    fi
fi
echo "✅ Using main entry point for packaging: \$MAIN_ENTRY_FROM_PACKAGE_JSON"

echo "5️⃣ Creating .vsix package..."
VSCE_PACKAGE_ARGS="--no-dependencies --no-yarn --allow-star-activation"

if vsce package \$VSCE_PACKAGE_ARGS; then
    echo "✅ .vsix package created successfully."
else
    echo "⚠️  Failed to create .vsix package with initial options. Trying with --skip-license..."
    if vsce package \$VSCE_PACKAGE_ARGS --skip-license; then
        echo "✅ .vsix package created successfully with --skip-license."
    else
        echo "⚠️  Packaging failed even with --skip-license."
        if [ -f ".vscodeignore" ]; then
            echo "   Attempting to package after temporarily moving .vscodeignore..."
            mv .vscodeignore .vscodeignore.bak_\$\$
            if vsce package \$VSCE_PACKAGE_ARGS --skip-license; then
                echo "✅ .vsix package created successfully after moving .vscodeignore."
            else
                echo "❌ Packaging failed even after moving .vscodeignore."
                mv .vscodeignore.bak_\$\$ .vscodeignore # Restore .vscodeignore
                exit 1
            fi
            mv .vscodeignore.bak_\$\$ .vscodeignore # Restore .vscodeignore
        else
            echo "❌ All packaging attempts failed."
            exit 1
        fi
    fi
fi

VSIX_FILE_FOUND=\$(ls -t *.vsix 2>/dev/null | head -n1)
if [ -n "\$VSIX_FILE_FOUND" ]; then
    echo "🎉🎉🎉 Extension packaged successfully! 🎉🎉🎉"
    echo "📁 VSIX File: \$VSIX_FILE_FOUND"
    echo "📏 Size: \$(du -h "\$VSIX_FILE_FOUND" | cut -f1)"
    echo "Install with VS Code UI or command: code --install-extension \"\$(pwd)/\$VSIX_FILE_FOUND\""
else
    echo "❌ No .vsix file found after packaging, though vsce reported success. This is unexpected."
    exit 1
fi

echo "✅ Packaging script completed."
