#!/bin/bash

# The New Fuse MCP RAG Integration Test Script
# This script tests the complete MCP integration including file coordination and RAG capabilities

set -e

echo "🚀 Starting The New Fuse MCP RAG Integration Tests..."
echo "================================================="

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
MCP_ENDPOINT="${BASE_URL}/mcp"
TEST_OUTPUT_DIR="./test-outputs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_LOG="${TEST_OUTPUT_DIR}/mcp_rag_test_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create test output directory
mkdir -p "$TEST_OUTPUT_DIR"

# Logging function
log() {
    echo -e "$1" | tee -a "$TEST_LOG"
}

# Test function
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"
    
    log "${BLUE}Testing: $test_name${NC}"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer dummy-token" \
            -d "$data" \
            "$MCP_ENDPOINT$endpoint" 2>&1 || echo "ERROR")
    else
        response=$(curl -s \
            -H "Authorization: Bearer dummy-token" \
            "$MCP_ENDPOINT$endpoint" 2>&1 || echo "ERROR")
    fi
    
    if [[ "$response" == *"ERROR"* ]] || [[ "$response" == *"error"* ]]; then
        log "${RED}❌ FAILED: $test_name${NC}"
        log "Response: $response"
        return 1
    else
        log "${GREEN}✅ PASSED: $test_name${NC}"
        # Save response to file for inspection
        echo "$response" > "${TEST_OUTPUT_DIR}/${test_name// /_}_${TIMESTAMP}.json"
        return 0
    fi
}

# Initialize test counters
total_tests=0
passed_tests=0

echo "Starting tests at $(date)" > "$TEST_LOG"

log "${YELLOW}Phase 1: Basic MCP Endpoint Tests${NC}"
log "=================================="

# Test 1: Get all capabilities
((total_tests++))
if run_test "Get All MCP Capabilities" "/capabilities"; then
    ((passed_tests++))
fi

# Test 2: Get all tools
((total_tests++))
if run_test "Get All MCP Tools" "/tools"; then
    ((passed_tests++))
fi

# Test 3: Get file coordination tools
((total_tests++))
if run_test "Get File Coordination Tools" "/file-coordination/tools"; then
    ((passed_tests++))
fi

# Test 4: Get RAG tools
((total_tests++))
if run_test "Get RAG Tools" "/rag/tools"; then
    ((passed_tests++))
fi

log ""
log "${YELLOW}Phase 2: RAG System Tests${NC}"
log "=========================="

# Test 5: RAG status
((total_tests++))
if run_test "Get RAG Status" "/rag/status"; then
    ((passed_tests++))
fi

# Test 6: RAG collections
((total_tests++))
if run_test "Get RAG Collections" "/rag/collections"; then
    ((passed_tests++))
fi

# Test 7: Documentation status
((total_tests++))
if run_test "Get Documentation Status" "/docs/status"; then
    ((passed_tests++))
fi

# Test 8: Documentation health
((total_tests++))
if run_test "Get Documentation Health" "/docs/health"; then
    ((passed_tests++))
fi

# Test 9: Documentation recommendations
((total_tests++))
if run_test "Get Documentation Recommendations" "/docs/recommendations"; then
    ((passed_tests++))
fi

log ""
log "${YELLOW}Phase 3: RAG Query Tests${NC}"
log "========================="

# Test 10: Simple RAG query
((total_tests++))
query_data='{"query": "VS Code extension development", "max_results": 3}'
if run_test "Simple RAG Query" "/rag/query" "POST" "$query_data"; then
    ((passed_tests++))
fi

# Test 11: Code search
((total_tests++))
code_search_data='{"query": "TypeScript interface", "language": "typescript", "max_results": 3}'
if run_test "Code Search" "/rag/search-code" "POST" "$code_search_data"; then
    ((passed_tests++))
fi

# Test 12: VS Code API search
((total_tests++))
vscode_api_data='{"api_name": "workspace", "include_examples": true, "max_results": 3}'
if run_test "VS Code API Search" "/rag/search-vscode-api" "POST" "$vscode_api_data"; then
    ((passed_tests++))
fi

# Test 13: Documentation search across all sources
((total_tests++))
doc_search_data='{"query": "configuration management", "maxResults": 5, "includeCode": true}'
if run_test "Multi-Source Documentation Search" "/docs/search" "POST" "$doc_search_data"; then
    ((passed_tests++))
fi

log ""
log "${YELLOW}Phase 4: File Coordination Tests${NC}"
log "=================================="

# Test 14: File coordination participants
((total_tests++))
participants_data='{"params": {}}'
if run_test "Get File Creation Participants" "/file-coordination/tools/getRegisteredParticipants" "POST" "$participants_data"; then
    ((passed_tests++))
fi

# Test 15: System health
((total_tests++))
health_data='{"params": {}}'
if run_test "Get System Health" "/file-coordination/tools/getSystemHealth" "POST" "$health_data"; then
    ((passed_tests++))
fi

log ""
log "${YELLOW}Phase 5: Broker Integration Tests${NC}"
log "=================================="

# Test 16: Execute directive through broker
((total_tests++))
directive_data='{
    "serverName": "rag",
    "action": "get_tools",
    "params": {},
    "sender": "integration_test"
}'
if run_test "Execute RAG Directive via Broker" "/execute" "POST" "$directive_data"; then
    ((passed_tests++))
fi

# Test 17: Execute file coordination directive
((total_tests++))
file_directive_data='{
    "serverName": "fileCoordination", 
    "action": "getSystemHealth",
    "params": {},
    "sender": "integration_test"
}'
if run_test "Execute File Coordination Directive" "/execute" "POST" "$file_directive_data"; then
    ((passed_tests++))
fi

log ""
log "${YELLOW}Test Results Summary${NC}"
log "===================="

# Calculate success rate
success_rate=$((passed_tests * 100 / total_tests))

if [ $passed_tests -eq $total_tests ]; then
    log "${GREEN}🎉 ALL TESTS PASSED! ($passed_tests/$total_tests)${NC}"
    log "${GREEN}Success Rate: $success_rate%${NC}"
    exit_code=0
elif [ $success_rate -ge 80 ]; then
    log "${YELLOW}⚠️  Most tests passed ($passed_tests/$total_tests)${NC}"
    log "${YELLOW}Success Rate: $success_rate%${NC}"
    log "${YELLOW}Some services may not be fully available${NC}"
    exit_code=0
else
    log "${RED}❌ INTEGRATION FAILED ($passed_tests/$total_tests)${NC}"
    log "${RED}Success Rate: $success_rate%${NC}"
    log "${RED}Critical services may be down${NC}"
    exit_code=1
fi

log ""
log "${BLUE}Test Artifacts:${NC}"
log "- Test log: $TEST_LOG"
log "- Response files: ${TEST_OUTPUT_DIR}/*_${TIMESTAMP}.json"
log ""
log "${BLUE}Next Steps:${NC}"
if [ $success_rate -lt 100 ]; then
    log "1. Check failed tests in the log above"
    log "2. Verify MCP-crawl4ai-rag server is running (if RAG tests failed)"
    log "3. Check NestJS application logs"
    log "4. Verify authentication is properly configured"
fi

log "5. Review response files for detailed API responses"
log "6. Consider running documentation crawling: POST $MCP_ENDPOINT/docs/update-all"

log ""
log "Integration test completed at $(date)"

exit $exit_code
