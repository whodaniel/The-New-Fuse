#!/bin/bash
set -e

echo "🔧 Fixing TypeORM dependencies..."

# Update MongoDB to a compatible version
bun --filter @the-new-fuse/api run add mongodb@^5.0.0

# Ensure TypeORM is using a compatible version
bun --filter @the-new-fuse/api run add typeorm@^0.3.0