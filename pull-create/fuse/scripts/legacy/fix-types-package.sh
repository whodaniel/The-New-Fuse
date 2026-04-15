#!/bin/bash

# Update tsconfig.json to allow importing .tsx files
sed -i '' 's/"isolatedModules": true,/"isolatedModules": true,\n    "allowImportingTsExtensions": true,/g' tsconfig.json

# Fix the re-export type issues in packages/types/src/index.ts
sed -i '' 's/export \* from/export type * from/g' packages/types/src/index.ts

# Build the types package
cd packages/types && yarn build

echo "Fixed types package"
