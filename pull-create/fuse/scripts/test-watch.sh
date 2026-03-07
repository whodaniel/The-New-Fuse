#!/bin/bash

# Test Watch Script
# Runs tests in watch mode for development

echo "========================================="
echo "Starting Test Watch Mode"
echo "========================================="
echo ""

# Parse arguments
PACKAGE=""
MODE="unit"

while [[ $# -gt 0 ]]; do
  case $1 in
    --package)
      PACKAGE="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Run appropriate test command
if [ -n "$PACKAGE" ]; then
  echo "Watching tests for package: $PACKAGE"
  pnpm --filter "$PACKAGE" run test:watch
else
  echo "Watching all $MODE tests"
  if [ "$MODE" = "unit" ]; then
    pnpm run test:unit -- --watch
  elif [ "$MODE" = "e2e" ]; then
    pnpm run test:e2e -- --ui
  else
    echo "Unknown mode: $MODE"
    exit 1
  fi
fi
