#!/bin/bash

set -euo pipefail

# Coverage thresholds
UNIT_THRESHOLD=80
INTEGRATION_THRESHOLD=70
E2E_THRESHOLD=50

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Checking test coverage against targets..."

# Run tests with coverage
echo "Running unit tests..."
yarn test:coverage

# Parse coverage results (adjust these paths according to your coverage report location)
UNIT_COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
INTEGRATION_COVERAGE=$(jq '.total.lines.pct' coverage/integration-coverage-summary.json)
E2E_COVERAGE=$(jq '.total.lines.pct' coverage/e2e-coverage-summary.json)

# Check unit test coverage
if (( $(echo "$UNIT_COVERAGE < $UNIT_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Unit test coverage ($UNIT_COVERAGE%) is below target ($UNIT_THRESHOLD%)${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Unit test coverage: $UNIT_COVERAGE%${NC}"
fi

# Check integration test coverage
if (( $(echo "$INTEGRATION_COVERAGE < $INTEGRATION_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Integration test coverage ($INTEGRATION_COVERAGE%) is below target ($INTEGRATION_THRESHOLD%)${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Integration test coverage: $INTEGRATION_COVERAGE%${NC}"
fi

# Check E2E test coverage
if (( $(echo "$E2E_COVERAGE < $E2E_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ E2E test coverage ($E2E_COVERAGE%) is below target ($E2E_THRESHOLD%)${NC}"
    exit 1
else
    echo -e "${GREEN}✓ E2E test coverage: $E2E_COVERAGE%${NC}"
fi

echo -e "${GREEN}✓ All coverage targets met!${NC}"