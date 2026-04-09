#!/bin/bash

# This script fixes the database composite issue

echo "🔧 Fixing database composite issue..."

# Update the database tsconfig.json to add composite: true
sed -i '' 's/"compilerOptions": {/"compilerOptions": {\n    "composite": true,/g' packages/database/tsconfig.json

echo "✅ Database composite issue fixed"
