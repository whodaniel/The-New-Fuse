#!/bin/bash

set -e

echo "Starting TypeScript error resolution..."

# Phase 1: Fix basic syntax and import issues
./scripts/fix-common-errors.js
./scripts/fix-react-interfaces.js
./scripts/fix-jsx-syntax.js

# Phase 2: Fix type-related issues
./scripts/fix-specific-typescript-errors.js
./scripts/patch-files.js

# Phase 3: Run automated fixes
yarn workspaces foreach -ptv run lint --fix
npx tsc --noEmit

echo "Initial fixes applied. Running final verification..."
