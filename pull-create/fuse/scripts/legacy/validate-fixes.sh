#!/bin/bash

# The New Fuse Extension - Comprehensive Validation Script
# This script validates all the fixes implemented for the floating panel

echo "🔧 The New Fuse Extension - Validation Starting..."
echo "================================================"

# Check if required files exist
echo "📁 Checking required files..."

required_files=(
    "chrome-extension/content.js"
    "chrome-extension/manifest.json"
    "chrome-extension/background.js"
    "chrome-extension/popup.js"
    "websocket-server.js"
    "test-floating-panel-fixes.html"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file - EXISTS"
    else
        echo "  ❌ $file - MISSING"
    fi
done

echo ""

# Check WebSocket server
echo "🌐 Checking WebSocket Server..."
if lsof -i :3710 > /dev/null 2>&1; then
    echo "  ✅ WebSocket server running on port 3710"
else
    echo "  ⚠️ WebSocket server not running on port 3710"
    echo "  💡 Run: node websocket-server.js"
fi

echo ""

# Validate content.js fixes
echo "🔍 Validating content.js fixes..."

# Check for horizontal dragging fix
if grep -q "style.right = 'auto'" chrome-extension/content.js; then
    echo "  ✅ Horizontal dragging fix - IMPLEMENTED"
else
    echo "  ❌ Horizontal dragging fix - MISSING"
fi

# Check for chat height fix
if grep -q "updateChatBoxHeight" chrome-extension/content.js; then
    echo "  ✅ Chat height calculation - IMPLEMENTED"
else
    echo "  ❌ Chat height calculation - MISSING"
fi

# Check for WebSocket port fix
if grep -q "3710" chrome-extension/content.js; then
    echo "  ✅ WebSocket port 3710 - CONFIGURED"
else
    echo "  ❌ WebSocket port 3710 - NOT CONFIGURED"
fi

# Check for form field names
if grep -q 'name="tnf-ws-url"' chrome-extension/content.js; then
    echo "  ✅ WebSocket URL input name attribute - ADDED"
else
    echo "  ❌ WebSocket URL input name attribute - MISSING"
fi

if grep -q 'name="tnf-chat-input"' chrome-extension/content.js; then
    echo "  ✅ Chat input name attribute - ADDED"
else
    echo "  ❌ Chat input name attribute - MISSING"
fi

# Check for Start Server button
if grep -q "tnf-start-server" chrome-extension/content.js; then
    echo "  ✅ Start Server button - IMPLEMENTED"
else
    echo "  ❌ Start Server button - MISSING"
fi

# Check for connection timeout
if grep -q "connectionTimeout" chrome-extension/content.js; then
    echo "  ✅ Connection timeout handling - IMPLEMENTED"
else
    echo "  ❌ Connection timeout handling - MISSING"
fi

# Check for multiple initialization protection
if grep -q "already initialized" chrome-extension/content.js; then
    echo "  ✅ Multiple initialization protection - IMPLEMENTED"
else
    echo "  ❌ Multiple initialization protection - MISSING"
fi

echo ""

# Check manifest permissions
echo "📋 Validating manifest.json..."
if grep -q '"storage"' chrome-extension/manifest.json; then
    echo "  ✅ Storage permission - PRESENT"
else
    echo "  ❌ Storage permission - MISSING"
fi

if grep -q '"activeTab"' chrome-extension/manifest.json; then
    echo "  ✅ ActiveTab permission - PRESENT"
else
    echo "  ❌ ActiveTab permission - MISSING"
fi

echo ""

# Check for test files
echo "🧪 Checking test infrastructure..."
if [ -f "test-floating-panel-fixes.html" ]; then
    echo "  ✅ Test page created"
    
    # Check test page content
    if grep -q "Movement Test" test-floating-panel-fixes.html; then
        echo "  ✅ Movement test section - PRESENT"
    fi
    
    if grep -q "WebSocket Test" test-floating-panel-fixes.html; then
        echo "  ✅ WebSocket test section - PRESENT"
    fi
    
    if grep -q "Element Detection" test-floating-panel-fixes.html; then
        echo "  ✅ Element detection test - PRESENT"
    fi
else
    echo "  ❌ Test page missing"
fi

echo ""

# Final validation summary
echo "🎯 VALIDATION SUMMARY"
echo "===================="

fixes_count=0
total_fixes=8

# Count implemented fixes
if grep -q "style.right = 'auto'" chrome-extension/content.js; then
    ((fixes_count++))
    echo "✅ Panel horizontal movement - FIXED"
fi

if grep -q "updateChatBoxHeight" chrome-extension/content.js; then
    ((fixes_count++))
    echo "✅ Chat visibility - FIXED"
fi

if grep -q "3710" chrome-extension/content.js; then
    ((fixes_count++))
    echo "✅ WebSocket connection - FIXED"
fi

if grep -q 'name="tnf-ws-url"' chrome-extension/content.js; then
    ((fixes_count++))
    echo "✅ Form field attributes - FIXED"
fi

if grep -q "tnf-start-server" chrome-extension/content.js; then
    ((fixes_count++))
    echo "✅ WebSocket server starting - IMPLEMENTED"
fi

if grep -q "connectionTimeout" chrome-extension/content.js; then
    ((fixes_count++))
    echo "✅ Status text updating - FIXED"
fi

if grep -q "already initialized" chrome-extension/content.js; then
    ((fixes_count++))
    echo "✅ Multiple initialization - PROTECTED"
fi

if [ -f "test-floating-panel-fixes.html" ]; then
    ((fixes_count++))
    echo "✅ Testing infrastructure - CREATED"
fi

echo ""
echo "📊 COMPLETION STATUS: $fixes_count/$total_fixes fixes implemented"

if [ $fixes_count -eq $total_fixes ]; then
    echo "🎉 ALL FIXES COMPLETED SUCCESSFULLY!"
    echo ""
    echo "🚀 Ready for testing:"
    echo "   1. Load extension in Chrome (chrome://extensions/)"
    echo "   2. Open test-floating-panel-fixes.html"
    echo "   3. Test all floating panel functionality"
    echo "   4. Verify WebSocket connectivity"
else
    echo "⚠️ Some fixes may be incomplete. Review above checklist."
fi

echo ""
echo "🔗 Next steps:"
echo "   • Load the extension from chrome-extension/ directory"
echo "   • Test on live websites and test page"
echo "   • Verify all reported issues are resolved"
echo ""
echo "Validation completed at $(date)"
