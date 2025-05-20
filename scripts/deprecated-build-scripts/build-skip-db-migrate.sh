#!/bin/bash

# Custom build script that skips database migrations

# Run the database:db:generate step directly
echo "✅ Running database:db:generate..."
cd packages/database && npx prisma generate

# Run the main build with --filter to exclude database
echo "✅ Running build on all packages except database..."
yarn turbo run build --filter=!@the-new-fuse/database

echo "✅ Build completed while skipping database migrations!"
