#!/bin/bash

# This script fixes the Chakra UI imports in the frontend package

echo "🔧 Fixing Chakra UI imports..."

# Navigate to the frontend package
cd apps/frontend

# Update package.json to use the correct Chakra UI version
sed -i '' 's/"@chakra-ui\/react": "\^3\.16\.0"/"@chakra-ui\/react": "\^2\.8\.2"/g' package.json

# Install the correct version
yarn install

# Fix imports in ThemeContext.tsx
sed -i '' 's/import { useColorMode, ThemeConfig } from '\''@chakra-ui\/react'\'';/import { useColorMode } from '\''@chakra-ui\/react'\'';\\ntype ThemeConfig = any;/g' src/contexts/ThemeContext.tsx

# Fix imports in ThemeCustomizer.tsx
sed -i '' 's/import {/import React from '\''react'\'';\nimport {/g' src/components/ThemeCustomizer.tsx

echo "✅ Chakra UI imports fixed"
