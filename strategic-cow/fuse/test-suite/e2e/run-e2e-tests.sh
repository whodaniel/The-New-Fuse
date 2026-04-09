#!/bin/bash

# =============================================================================
# The New Fuse - End-to-End Test Runner
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${TEST_DIR}/../../reports/e2e"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORTS_DIR}/test-report-${TIMESTAMP}.json"
HTML_REPORT="${REPORTS_DIR}/test-report-${TIMESTAMP}.html"

# Create reports directory
mkdir -p "${REPORTS_DIR}"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   The New Fuse - End-to-End Test Suite                       ║${NC}"
echo -e "${BLUE}║   Production Readiness Testing                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 not found${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 found${NC}"
        return 0
    fi
}

check_command node || exit 1
check_command pnpm || exit 1
check_command docker || exit 1

# Check if services are running
echo ""
echo -e "${YELLOW}🔍 Checking services...${NC}"

check_service() {
    local url=$1
    local name=$2

    if curl -s -f -o /dev/null "${url}"; then
        echo -e "${GREEN}✓ ${name} is running${NC}"
        return 0
    else
        echo -e "${RED}✗ ${name} is not responding${NC}"
        return 1
    fi
}

SERVICES_OK=true

check_service "http://localhost:3000" "Frontend" || SERVICES_OK=false
check_service "http://localhost:3001/health" "API Server" || SERVICES_OK=false
check_service "http://localhost:3004/health" "Backend Server" || SERVICES_OK=false

# Check database
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    SERVICES_OK=false
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is not running${NC}"
    SERVICES_OK=false
fi

if [ "${SERVICES_OK}" = false ]; then
    echo ""
    echo -e "${RED}⚠️  Not all services are running!${NC}"
    echo -e "${YELLOW}Would you like to start services with docker-compose? (y/n)${NC}"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}Starting services...${NC}"
        cd ../.. && pnpm run docker:start
        sleep 10
    else
        echo -e "${RED}Aborting tests. Please start services manually.${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Test execution
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Running Test Suites                                        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

declare -a TEST_RESULTS

run_test_suite() {
    local test_file=$1
    local test_name=$2

    echo -e "${YELLOW}🧪 Running: ${test_name}${NC}"
    echo "   File: ${test_file}"
    echo ""

    # Run Playwright tests
    if pnpm exec playwright test "${test_file}" --reporter=json > "${REPORTS_DIR}/temp.json" 2>&1; then
        echo -e "${GREEN}✓ ${test_name} - PASSED${NC}"
        TEST_RESULTS+=("PASSED|${test_name}")
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ ${test_name} - FAILED${NC}"
        TEST_RESULTS+=("FAILED|${test_name}")
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
}

# Run all test suites
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 1: Agent Lifecycle${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
run_test_suite "01-agent-lifecycle.spec.ts" "Agent Lifecycle Tests"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 2: Multi-Agent Collaboration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
run_test_suite "02-multi-agent-collaboration.spec.ts" "Multi-Agent Collaboration Tests"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 3: Load Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
run_test_suite "03-load-testing.spec.ts" "Load Testing Suite"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 4: Integration Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
run_test_suite "04-integration-testing.spec.ts" "Integration Testing Suite"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 5: Chaos Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
run_test_suite "05-chaos-testing.spec.ts" "Chaos Testing Suite"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 6: Real-World Scenarios${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
run_test_suite "06-real-world-scenarios.spec.ts" "Real-World Scenarios"

# Generate summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test Summary                                                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:   ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:        ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:        ${FAILED_TESTS}${NC}"
echo -e "${YELLOW}Skipped:       ${SKIPPED_TESTS}${NC}"
echo ""

# Calculate success rate
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Success Rate:  ${SUCCESS_RATE}%"
echo ""

# Determine production readiness
if [ ${SUCCESS_RATE} -ge 95 ]; then
    echo -e "${GREEN}✓ PRODUCTION READY${NC}"
    READINESS="READY"
elif [ ${SUCCESS_RATE} -ge 80 ]; then
    echo -e "${YELLOW}⚠ NEEDS IMPROVEMENT${NC}"
    READINESS="NEEDS_IMPROVEMENT"
else
    echo -e "${RED}✗ NOT PRODUCTION READY${NC}"
    READINESS="NOT_READY"
fi

# Generate JSON report
cat > "${REPORT_FILE}" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "totalTests": ${TOTAL_TESTS},
  "passed": ${PASSED_TESTS},
  "failed": ${FAILED_TESTS},
  "skipped": ${SKIPPED_TESTS},
  "successRate": ${SUCCESS_RATE},
  "productionReadiness": "${READINESS}",
  "testResults": [
EOF

first=true
for result in "${TEST_RESULTS[@]}"; do
    IFS='|' read -r status name <<< "$result"
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> "${REPORT_FILE}"
    fi
    echo "    {\"name\": \"${name}\", \"status\": \"${status}\"}" >> "${REPORT_FILE}"
done

cat >> "${REPORT_FILE}" <<EOF

  ]
}
EOF

echo ""
echo -e "${GREEN}✓ Report saved to: ${REPORT_FILE}${NC}"

# Generate HTML report
cat > "${HTML_REPORT}" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The New Fuse - E2E Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .skipped { color: #f59e0b; }
        .test-list {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .test-item {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-passed {
            background: #d1fae5;
            color: #059669;
        }
        .badge-failed {
            background: #fee2e2;
            color: #dc2626;
        }
        .readiness {
            font-size: 24px;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 The New Fuse</h1>
        <p>End-to-End Test Report - Production Readiness Assessment</p>
        <p class="readiness">STATUS: <span id="readiness"></span></p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-label">Total Tests</div>
            <div class="stat-value" id="total"></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Passed</div>
            <div class="stat-value passed" id="passed"></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Failed</div>
            <div class="stat-value failed" id="failed"></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Success Rate</div>
            <div class="stat-value" id="successRate"></div>
        </div>
    </div>

    <div class="test-list">
        <h2>Test Results</h2>
        <div id="testResults"></div>
    </div>

    <script>
        // Load test data (will be injected by the script)
        const data = REPORT_DATA;

        document.getElementById('total').textContent = data.totalTests;
        document.getElementById('passed').textContent = data.passed;
        document.getElementById('failed').textContent = data.failed;
        document.getElementById('successRate').textContent = data.successRate + '%';
        document.getElementById('readiness').textContent = data.productionReadiness;

        const resultsContainer = document.getElementById('testResults');
        data.testResults.forEach(test => {
            const item = document.createElement('div');
            item.className = 'test-item';
            item.innerHTML = `
                <span>${test.name}</span>
                <span class="badge badge-${test.status.toLowerCase()}">${test.status}</span>
            `;
            resultsContainer.appendChild(item);
        });
    </script>
</body>
</html>
EOF

# Inject data into HTML
REPORT_DATA=$(cat "${REPORT_FILE}")
sed -i "s|REPORT_DATA|${REPORT_DATA}|g" "${HTML_REPORT}"

echo -e "${GREEN}✓ HTML report saved to: ${HTML_REPORT}${NC}"
echo ""

# Open HTML report in browser (optional)
if command -v xdg-open &> /dev/null; then
    xdg-open "${HTML_REPORT}"
elif command -v open &> /dev/null; then
    open "${HTML_REPORT}"
fi

# Exit with appropriate code
if [ ${FAILED_TESTS} -eq 0 ]; then
    exit 0
else
    exit 1
fi
