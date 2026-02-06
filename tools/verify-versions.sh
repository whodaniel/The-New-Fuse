#!/bin/bash

echo "🔍 Verifying package versions..."

# Check NestJS versions and dependencies
echo "Checking NestJS versions and dependencies..."
yarn why @nestjs/common
yarn why @nestjs/core
yarn why @nestjs/platform-express
yarn why reflect-metadata
yarn why rxjs

# Check Drizzle versions
echo "Checking Drizzle versions..."
yarn why @drizzle/client
yarn why drizzle

# Check Firebase dependencies
echo "Checking Firebase dependencies..."
yarn why @firebase/app
yarn why @firebase/app-types

# Check React dependencies
echo "Checking React dependencies..."
yarn why react
yarn why @types/react

# Check Express dependencies
echo "Checking Express dependencies..."
yarn why express
yarn why express-rate-limit

# Check for version mismatches in reflect-metadata
echo "Checking reflect-metadata versions..."
yarn why reflect-metadata
yarn workspaces foreach -v run yarn why reflect-metadata

# Check for duplicate dependencies
echo "Checking for duplicates..."
yarn dedupe --check

# Verify peer dependencies
echo "Checking peer dependency issues..."
yarn info --name-only | grep -E '@(nestjs|chakra-ui|firebase)' | while read -r pkg; do
    yarn why "$pkg"
done

echo "✨ Version check complete!"
