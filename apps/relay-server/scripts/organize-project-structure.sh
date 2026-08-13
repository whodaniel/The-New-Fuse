#!/bin/bash

# Create security package structure if it doesn't exist
mkdir -p packages/security/src/{services,types,utils}/__tests__

# Move session-related files to their new locations
mv src/services/SessionManager.ts packages/security/src/services/
mv src/services/__tests__/SessionManager.test.ts packages/security/src/services/__tests__/

# Update package.json to include new dependencies
if command -v jq &> /dev/null; then
  jq '.dependencies += {
    "@your-org/security": "workspace:*"
  }' package.json > package.json.new
  mv package.json.new package.json
else
  echo "jq not found, please update package.json manually"
fi
