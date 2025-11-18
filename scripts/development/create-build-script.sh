#!/bin/bash

# This script creates a custom build script that skips the database migration failures

echo "🔧 Creating a custom build script to bypass database migration errors..."

# Create the build script
cat > "./build-skip-db-migrate.sh" << 'EOF'
#!/bin/bash

# Custom build script that skips database migrations

# Run the database:db:generate step directly
echo "✅ Running database:db:generate..."
cd packages/database && npx prisma generate

# Run the main build with --filter to exclude database
echo "✅ Running build on all packages except database..."
yarn turbo run build --filter=!@the-new-fuse/database

echo "✅ Build completed while skipping database migrations!"
EOF

# Make the new script executable
chmod +x "./build-skip-db-migrate.sh"

echo "✅ Created build-skip-db-migrate.sh"
echo "Run './build-skip-db-migrate.sh' to build your project while skipping database migrations"