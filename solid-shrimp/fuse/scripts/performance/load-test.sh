#!/bin/bash

##
# Load Testing Script
# Performs load testing on API endpoints using Apache Bench or artillery
##

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8080}"
CONCURRENT_USERS="${CONCURRENT_USERS:-10}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-1000}"
DURATION="${DURATION:-60}"
RESULTS_DIR="./performance-results"

echo -e "${GREEN}🔥 Starting Load Tests${NC}"
echo "================================="
echo "API URL: $API_URL"
echo "Concurrent Users: $CONCURRENT_USERS"
echo "Total Requests: $TOTAL_REQUESTS"
echo "Duration: ${DURATION}s"
echo "================================="
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Check if artillery is installed
if ! command -v artillery &> /dev/null; then
    echo -e "${YELLOW}⚠️  Artillery not found. Installing...${NC}"
    npm install -g artillery
fi

# Test 1: Health Check Endpoint
echo -e "${GREEN}Test 1: Health Check Endpoint${NC}"
artillery quick \
    --count "$TOTAL_REQUESTS" \
    --num "$CONCURRENT_USERS" \
    "$API_URL/health" \
    --output "$RESULTS_DIR/health-check.json"

# Test 2: API Authentication
echo -e "\n${GREEN}Test 2: API List Endpoint${NC}"
artillery quick \
    --count "$TOTAL_REQUESTS" \
    --num "$CONCURRENT_USERS" \
    "$API_URL/api/v1/agents" \
    --output "$RESULTS_DIR/agents-list.json"

# Test 3: Sustained Load Test
echo -e "\n${GREEN}Test 3: Sustained Load Test${NC}"
cat > "$RESULTS_DIR/sustained-load.yml" <<EOF
config:
  target: "$API_URL"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  plugins:
    expect: {}
  processor: "./load-test-functions.js"

scenarios:
  - name: "Full user flow"
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200
      - get:
          url: "/api/v1/agents"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/api/v1/workflows"
          expect:
            - statusCode: 200
EOF

artillery run "$RESULTS_DIR/sustained-load.yml" \
    --output "$RESULTS_DIR/sustained-load-results.json"

# Test 4: Spike Test
echo -e "\n${GREEN}Test 4: Spike Test${NC}"
cat > "$RESULTS_DIR/spike-test.yml" <<EOF
config:
  target: "$API_URL"
  phases:
    - duration: 30
      arrivalRate: 10
      name: "Normal load"
    - duration: 10
      arrivalRate: 500
      name: "Spike"
    - duration: 30
      arrivalRate: 10
      name: "Recovery"

scenarios:
  - name: "Spike scenario"
    flow:
      - get:
          url: "/health"
EOF

artillery run "$RESULTS_DIR/spike-test.yml" \
    --output "$RESULTS_DIR/spike-test-results.json"

# Generate HTML reports
echo -e "\n${GREEN}📊 Generating HTML Reports${NC}"
for json_file in "$RESULTS_DIR"/*.json; do
    html_file="${json_file%.json}.html"
    artillery report "$json_file" --output "$html_file" || true
done

# Summary
echo -e "\n${GREEN}✓ Load Tests Complete${NC}"
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "Review the HTML reports for detailed analysis:"
ls -1 "$RESULTS_DIR"/*.html 2>/dev/null || echo "No HTML reports generated"

# Check for failures
if [ -f "$RESULTS_DIR/sustained-load-results.json" ]; then
    errors=$(jq '.aggregate.counters["errors.ECONNREFUSED"] // 0' "$RESULTS_DIR/sustained-load-results.json")
    if [ "$errors" -gt 0 ]; then
        echo -e "\n${RED}⚠️  Warning: ${errors} connection errors detected${NC}"
        exit 1
    fi
fi

echo -e "\n${GREEN}All load tests passed successfully!${NC}"
