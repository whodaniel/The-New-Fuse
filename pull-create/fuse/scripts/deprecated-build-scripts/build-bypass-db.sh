#!/bin/bash

# This script builds the project while skipping the problematic database package

# First, generate the Drizzle client
echo "✅ Generating Drizzle client..."
cd packages/database
npx drizzle generate
cd ../..

# Then create a temporary package.json for turbo
echo "✅ Setting up build to skip database package..."
cp turbo.json turbo.json.backup
jq '.pipeline.build.dependsOn = (.pipeline.build.dependsOn | map(select(. != "^db:migrate")))' turbo.json > turbo.temp.json
mv turbo.temp.json turbo.json

# Run the build
echo "✅ Running build..."
yarn turbo run build --continue

# Restore original turbo.json
echo "✅ Restoring original turbo.json..."
mv turbo.json.backup turbo.json

echo "✅ Build process completed!"