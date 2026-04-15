#!/bin/bash

# 1. Check TypeScript compilation
echo "=== Checking TypeScript compilation ==="
yarn type-check

# 2. Run linting to ensure code style
echo -e "\n=== Running linter ==="
yarn lint

# 3. Run tests to ensure nothing broke
echo -e "\n=== Running tests ==="
yarn test

# 4. Check for any remaining .js files in React components
echo -e "\n=== Checking for remaining .js files in React components ==="
find apps/frontend/src -type f -name "*.js" ! -name "*.test.js" ! -name "*.config.js" ! -name "*.setup.js"

# 5. Run project state check
echo -e "\n=== Running project state check ==="
./check-project-state.sh

# 6. Verify all services health
echo -e "\n=== Checking services health ==="
./scripts/check-app-health.sh