#!/bin/bash

# Test All Script
# Runs all tests in the monorepo with proper sequencing

set -e

echo "========================================="
echo "Running Complete Test Suite"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to run command and track failures
run_test() {
  local name=$1
  local command=$2

  echo -e "${YELLOW}Running: ${name}${NC}"
  if eval "$command"; then
    echo -e "${GREEN}✓ ${name} passed${NC}"
    echo ""
  else
    echo -e "${RED}✗ ${name} failed${NC}"
    echo ""
    FAILURES=$((FAILURES + 1))
  fi
}

# Run linting
run_test "Linting" "pnpm run lint"

# Run type checking
run_test "Type Checking" "pnpm run type-check"

# Run unit tests
run_test "Unit Tests" "pnpm run test:unit"

# Run integration tests (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  run_test "Integration Tests" "pnpm run test:integration"
else
  echo -e "${YELLOW}⚠ Skipping integration tests (DATABASE_URL not set)${NC}"
  echo ""
fi

# Run E2E tests (if requested)
if [ "$RUN_E2E" = "true" ]; then
  run_test "E2E Tests" "pnpm run test:e2e"
else
  echo -e "${YELLOW}⚠ Skipping E2E tests (RUN_E2E not set)${NC}"
  echo ""
fi

# Summary
echo "========================================="
echo "Test Suite Summary"
echo "========================================="
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}$FAILURES test suite(s) failed${NC}"
  exit 1
fi
