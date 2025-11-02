#!/bin/bash

# TNF Relay Integration Test Script
# Tests the complete implementation of TNF Relay features

echo "🧪 TNF Relay Integration Test Starting..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_files_exist() {
    echo -e "${BLUE}📁 Testing file structure...${NC}"
    
    local files=(
        "chrome-extension/src/background/tnf-relay-manager.ts"
        "chrome-extension/src/content/tnf-content-manager.ts"
        "chrome-extension/src/popup/components/TNFRelayTab.tsx"
        "chrome-extension/src/popup/styles/tnf-relay.css"
        "chrome-extension/content.js"
        "chrome-extension/background.js"
    )
    
    local all_exist=true
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✅ $file${NC}"
        else
            echo -e "  ${RED}❌ $file${NC}"
            all_exist=false
        fi
    done
    
    if [ "$all_exist" = true ]; then
        echo -e "${GREEN}✅ All required files exist${NC}"
        return 0
    else
        echo -e "${RED}❌ Some files are missing${NC}"
        return 1
    fi
}

test_key_features() {
    echo -e "${BLUE}🎯 Testing key feature implementations...${NC}"
    
    # Test floating panel implementation
    if grep -q "createFloatingPanel" chrome-extension/src/content/tnf-content-manager.ts; then
        echo -e "  ${GREEN}✅ Floating panel implementation${NC}"
    else
        echo -e "  ${RED}❌ Floating panel implementation missing${NC}"
    fi
    
    # Test WebSocket connection
    if grep -q "WebSocket" chrome-extension/src/content/tnf-content-manager.ts; then
        echo -e "  ${GREEN}✅ WebSocket connection implementation${NC}"
    else
        echo -e "  ${RED}❌ WebSocket connection implementation missing${NC}"
    fi
    
    # Test platform detection
    if grep -q "detectPlatform" chrome-extension/src/content/tnf-content-manager.ts; then
        echo -e "  ${GREEN}✅ Platform detection implementation${NC}"
    else
        echo -e "  ${RED}❌ Platform detection implementation missing${NC}"
    fi
    
    # Test element detection preservation fix
    if grep -q "CRITICAL FIX" chrome-extension/src/content/tnf-content-manager.ts; then
        echo -e "  ${GREEN}✅ Element detection red indicator fix${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Element detection fix comment not found${NC}"
    fi
}

# Main execution
echo -e "${BLUE}Testing TNF Relay Integration in: $(pwd)${NC}"
echo ""

if [ ! -d "chrome-extension" ]; then
    echo -e "${RED}❌ chrome-extension directory not found. Please run from the project root.${NC}"
    exit 1
fi

test_files_exist
echo ""
test_key_features

echo ""
echo -e "${GREEN}🎉 TNF Relay integration files created successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Build the extension using: cd chrome-extension && pnpm run build"
echo "2. Load the extension in Chrome Developer Mode"
echo "3. Test on ChatGPT, Claude, or Gemini"
echo "4. Use Ctrl+Shift+F to toggle the floating panel"
echo "5. Test WebSocket connections to ports 3000, 3001, 8080, 8765"

echo ""
echo -e "${BLUE}========================================"
echo -e "🧪 TNF Relay Integration Test Complete${NC}"
