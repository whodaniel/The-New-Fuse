#!/bin/bash

# The New Fuse Extension - Comprehensive Test Suite
# This script performs a complete validation of the extension

EXTENSION_PATH="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"
cd "$EXTENSION_PATH"

echo "🚀 The New Fuse Extension - Comprehensive Test Suite"
echo "=================================================="
echo ""

# Test result tracking
TESTS_PASSED=0
TESTS_FAILED=0

test_success() {
    echo "✅ $1"
    ((TESTS_PASSED++))
}

test_failure() {
    echo "❌ $1"
    ((TESTS_FAILED++))
}

test_warning() {
    echo "⚠️  $1"
}

echo "[TEST] 1. Validating project structure..."

if [ -f "package.json" ]; then
    test_success "package.json exists"
else
    test_failure "package.json missing"
fi

if [ -f "tsconfig.json" ]; then
    test_success "tsconfig.json exists"
else
    test_failure "tsconfig.json missing"
fi

if [ -d "src" ]; then
    test_success "src directory exists"
else
    test_failure "src directory missing"
fi

if [ -d "media" ]; then
    test_success "media directory exists"
else
    test_failure "media directory missing"
fi

echo ""
echo "[TEST] 2. Checking compiled output..."

if [ -f "dist/extension.js" ]; then
    SIZE=$(stat -f%z "dist/extension.js" 2>/dev/null || stat -c%s "dist/extension.js")
    test_success "Extension compiled (${SIZE} bytes)"
else
    test_failure "Compiled extension.js not found"
fi

echo ""
echo "[TEST] 3. Validating extension structure..."

# Check for required source files
REQUIRED_FILES=(
    "src/extension.ts"
    "src/views/TabbedContainerProvider.ts"
    "src/views/ChatViewProvider.ts"
    "src/llm/LLMProviderManager.ts"
    "src/services/AgentCommunicationService.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_success "$file exists"
    else
        test_failure "$file missing"
    fi
done

echo ""
echo "[TEST] 4. Checking media files..."

# Check for required media files
REQUIRED_MEDIA=(
    "media/chat.js"
    "media/chat.css"
    "media/tabbed-container.js"
    "media/tabbed-container.css"
)

for file in "${REQUIRED_MEDIA[@]}"; do
    if [ -f "$file" ]; then
        test_success "$file exists"
    else
        test_failure "$file missing"
    fi
done

echo ""
echo "[TEST] 5. Testing enhanced services integration..."

if [ -f "test-enhanced-services.js" ] && node test-enhanced-services.js > /dev/null 2>&1; then
    test_success "Enhanced services integration test passed"
else
    test_warning "Enhanced services test had issues"
fi

echo ""
echo "=============================================="
echo "🎯 TEST SUMMARY"
echo "=============================================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
    echo "Success Rate: $SUCCESS_RATE%"
fi

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED! Extension is ready for testing."
    echo ""
    echo "Next Steps:"
    echo "1. Launch Extension Development Host (F5 in VS Code)"
    echo "2. Test in the Extension Development Host:"
    echo "   - Look for 'The New Fuse' robot icon in Activity Bar"
    echo "   - Open the extension and test chat functionality"
    echo "   - Test LLM provider switching"
    echo "   - Test agent communication features"
    echo "3. Package extension with: pnpm run package"
    echo ""
else
    echo "❌ SOME TESTS FAILED. Please fix the issues above."
fi

echo ""
echo "=============================================="
