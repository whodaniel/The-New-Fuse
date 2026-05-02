#!/bin/bash
set -e

echo "🔧 Fixing TypeORM dependencies..."

# Update MongoDB to a compatible version
yarn workspace @the-new-fuse/api add mongodb@^5.0.0

# Ensure TypeORM is using a compatible version
yarn workspace @the-new-fuse/api add typeorm@^0.3.0