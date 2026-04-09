#!/bin/bash

# This script fixes the Jest configuration

echo "🔧 Fixing Jest configuration..."

# Rename jest.config.js to jest.config.cjs
if [ -f "jest.config.js" ]; then
  mv jest.config.js jest.config.cjs
  echo "Renamed jest.config.js to jest.config.cjs"
fi

# Update package.json to use jest.config.cjs
sed -i '' 's/"test": "jest --config jest.config.js"/"test": "jest --config jest.config.cjs"/g' package.json
sed -i '' 's/"test:watch": "jest --config jest.config.js --watch"/"test:watch": "jest --config jest.config.cjs --watch"/g' package.json
sed -i '' 's/"test:coverage": "jest --config jest.coverage.config.js"/"test:coverage": "jest --config jest.coverage.config.cjs"/g' package.json

echo "✅ Jest configuration fixed"
