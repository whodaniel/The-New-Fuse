#!/bin/bash

echo "🔍 The New Fuse - Build Status Report"
echo "======================================="
echo ""

# Chrome Extension
echo "📱 Chrome Extension:"
if [ -d "./chrome-extension/dist" ] && [ -f "./chrome-extension/dist/manifest.json" ]; then
    echo "  ✅ Chrome Extension - Built successfully"
    echo "     📁 Location: ./chrome-extension/dist/"
    ls -la chrome-extension/dist/ | wc -l | awk '{print "     📄 Files: " $1-1 " files"}'
else
    echo "  ❌ Chrome Extension - Not built"
fi

echo ""

# MCP Server
echo "🤖 MCP Server:"
if [ -d "./dist/mcp" ] && [ -f "./dist/mcp/server.js" ]; then
    echo "  ✅ MCP Server - Built successfully"
    echo "     📁 Location: ./dist/mcp/"
    ls -la dist/mcp/ | wc -l | awk '{print "     📄 Files: " $1-1 " files"}'
else
    echo "  ❌ MCP Server - Not built"
fi

echo ""

# VS Code Extension (check for built files)
echo "🔧 VS Code Extension:"
if [ -d "./src/vscode-extension" ]; then
    echo "  📁 VS Code Extension source available"
    if [ -d "./src/vscode-extension/out" ] || [ -d "./src/vscode-extension/dist" ]; then
        echo "  ✅ VS Code Extension - Built"
    else
        echo "  ⚠️  VS Code Extension - Source available but not built"
    fi
else
    echo "  ❌ VS Code Extension - Not found"
fi

echo ""

# Packages
echo "📦 Packages:"
if [ -d "./packages" ]; then
    built_packages=0
    total_packages=0
    for package in packages/*/; do
        if [ -d "$package" ]; then
            total_packages=$((total_packages + 1))
            package_name=$(basename "$package")
            if [ -d "${package}dist" ] || [ -d "${package}build" ] || [ -d "${package}lib" ]; then
                echo "  ✅ $package_name - Built"
                built_packages=$((built_packages + 1))
            else
                echo "  ⚠️  $package_name - Not built"
            fi
        fi
    done
    echo "  📊 Summary: $built_packages/$total_packages packages built"
else
    echo "  ❌ Packages directory not found"
fi

echo ""

# Applications
echo "🚀 Applications:"
if [ -d "./apps" ]; then
    built_apps=0
    total_apps=0
    for app in apps/*/; do
        if [ -d "$app" ]; then
            total_apps=$((total_apps + 1))
            app_name=$(basename "$app")
            if [ -d "${app}dist" ] || [ -d "${app}build" ] || [ -d "${app}.next" ]; then
                echo "  ✅ $app_name - Built"
                built_apps=$((built_apps + 1))
            else
                echo "  ⚠️  $app_name - Not built"
            fi
        fi
    done
    echo "  📊 Summary: $built_apps/$total_apps applications built"
else
    echo "  ❌ Apps directory not found"
fi

echo ""
echo "======================================="
echo "🎯 Next Steps:"
echo "1. Chrome Extension: Load from ./chrome-extension/dist/ in Chrome"
echo "2. MCP Server: Test with 'node ./dist/mcp/server.js'"
echo "3. Build remaining components as needed"
echo "======================================="
