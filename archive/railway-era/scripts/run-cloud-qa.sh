#!/bin/bash

#################################################################################
# Cloud QA Runner - Runs comprehensive QA testing on CloudRuntime cloud infrastructure
#################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOUD_RUNTIME_SANDBOX_URL="${CLOUD_RUNTIME_SANDBOX_URL:-https://tnf-cloud-sandbox-v2-production.thenewfuse.com}"
TARGET_SITE="https://thenewfuse.com"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🚀 Cloud QA Test Runner for thenewfuse.com${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

#################################################################################
# 1. Verify CloudRuntime Cloud Browser is Running
#################################################################################
echo -e "${YELLOW}📡 Step 1: Verifying CloudRuntime cloud browser status...${NC}"

DEVTOOLS_CHECK=$(curl -s -w "%{http_code}" -o /tmp/devtools_response.json "$CLOUD_RUNTIME_SANDBOX_URL/api/browser/devtools" || echo "000")

if [ "$DEVTOOLS_CHECK" != "200" ]; then
    echo -e "${RED}❌ Cloud browser not accessible${NC}"
    echo -e "${YELLOW}Response code: $DEVTOOLS_CHECK${NC}"
    echo ""
    echo "Please ensure the CloudRuntime sandbox is deployed and running:"
    echo "1. Visit: https://cloud_runtime.app"
    echo "2. Check service: tnf-cloud-sandbox-v2"
    echo "3. Verify deployment status"
    echo ""
    echo "Or try: curl $CLOUD_RUNTIME_SANDBOX_URL/api/browser/devtools"
    exit 1
fi

echo -e "${GREEN}✅ Cloud browser is running${NC}"
cat /tmp/devtools_response.json | jq '.' 2>/dev/null || cat /tmp/devtools_response.json
echo ""

#################################################################################
# 2. Deploy QA Script to Cloud
#################################################################################
echo -e "${YELLOW}📤 Step 2: Deploying comprehensive QA script to cloud...${NC}"

# Check if comprehensive_qa.js exists locally
QA_SCRIPT_PATH="apps/cloud-sandbox/scripts/comprehensive_qa.js"

if [ ! -f "$QA_SCRIPT_PATH" ]; then
    echo -e "${RED}❌ QA script not found at: $QA_SCRIPT_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ QA script found${NC}"
echo ""

#################################################################################
# 3. Trigger Cloud QA Execution
#################################################################################
echo -e "${YELLOW}🎯 Step 3: Triggering cloud QA execution...${NC}"
echo ""
echo "This will:"
echo "  • Test homepage and all linked pages"
echo "  • Validate links, buttons, forms, images"
echo "  • Check console errors"
echo "  • Measure performance"
echo "  • Generate comprehensive report"
echo ""
echo -e "${BLUE}Target: $TARGET_SITE${NC}"
echo ""

# Option 1: Execute via CloudRuntime CLI (if available)
if command -v cloud_runtime &> /dev/null; then
    echo -e "${GREEN}Using CloudRuntime CLI to run QA...${NC}"
    cloud_runtime run node apps/cloud-sandbox/scripts/comprehensive_qa.js

# Option 2: Execute via SSH/API
elif [ -n "$CLOUD_RUNTIME_API_TOKEN" ]; then
    echo -e "${GREEN}Using CloudRuntime API to trigger QA...${NC}"
    # Trigger via API endpoint
    curl -X POST "$CLOUD_RUNTIME_SANDBOX_URL/api/qa/run" \
        -H "Content-Type: application/json" \
        -d '{
            "target": "'$TARGET_SITE'",
            "config": {
                "maxDepth": 3,
                "maxPagesPerLevel": 10,
                "validateAll": true
            }
        }'

# Option 3: Manual execution instructions
else
    echo -e "${YELLOW}⚠️  CloudRuntime CLI not found${NC}"
    echo ""
    echo "To run the QA test on CloudRuntime, you have two options:"
    echo ""
    echo "Option A: Install CloudRuntime CLI"
    echo "  npm install -g @cloud_runtime/cli"
    echo "  cloud_runtime login"
    echo "  cloud_runtime link"
    echo "  Then re-run this script"
    echo ""
    echo "Option B: SSH into CloudRuntime service"
    echo "  1. Go to: https://cloud_runtime.app/project/<your-project>"
    echo "  2. Open service: tnf-cloud-sandbox-v2"
    echo "  3. Click 'Shell' tab"
    echo "  4. Run: node apps/cloud-sandbox/scripts/comprehensive_qa.js"
    echo ""
    echo "Option C: Use Antigravity to monitor"
    echo "  The QA script can run automatically if properly configured."
    echo "  Use the instructions in ANTIGRAVITY_QA_INSTRUCTIONS.md"
    exit 0
fi

echo ""

#################################################################################
# 4. Monitor QA Execution
#################################################################################
echo -e "${YELLOW}👁️  Step 4: QA test is now running on CloudRuntime cloud${NC}"
echo ""
echo "To monitor the test in real-time using Antigravity:"
echo ""
echo -e "${BLUE}1. Open Antigravity AI${NC}"
echo -e "${BLUE}2. Say: 'Connect to the CloudRuntime browser and show me the QA test status'${NC}"
echo -e "${BLUE}3. Say: 'Show me screenshots of what's being tested'${NC}"
echo -e "${BLUE}4. Say: 'What console errors are appearing?'${NC}"
echo -e "${BLUE}5. Say: 'List all network requests'${NC}"
echo ""
echo "For continuous monitoring:"
echo -e "${BLUE}Say: 'Monitor the QA test and report updates every 30 seconds'${NC}"
echo ""
echo -e "${GREEN}✅ Cloud QA test initiated successfully!${NC}"
echo ""
echo "Results will be:"
echo "  • Displayed in real-time via DevTools"
echo "  • Saved to /tmp/qa_report_<timestamp>.json on CloudRuntime"
echo "  • Accessible via Antigravity monitoring"
echo ""

#################################################################################
# 5. Provide Next Steps
#################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   📋 Next Steps${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. ✅ Monitor via Antigravity (recommended)"
echo "   Use the monitoring prompts from ANTIGRAVITY_QA_INSTRUCTIONS.md"
echo ""
echo "2. 📊 View detailed results"
echo "   SSH into CloudRuntime and check: /tmp/qa_report_*.json"
echo ""
echo "3. 🔍 Debug specific issues"
echo "   Ask Antigravity to: 'Debug why [specific issue] is failing'"
echo ""
echo "4. 🎯 Focus on critical issues"
echo "   Ask Antigravity to: 'Show me all critical QA failures'"
echo ""

