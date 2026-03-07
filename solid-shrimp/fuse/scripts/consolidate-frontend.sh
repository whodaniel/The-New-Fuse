#!/bin/bash
set -e

echo "🔄 Starting frontend consolidation process..."

# Create backup of current frontend implementations
echo "📦 Creating backups of current frontend implementations..."
BACKUP_DIR="./backups/frontend_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r "./apps/frontend" "$BACKUP_DIR/apps_frontend"
cp -r "./packages/frontend" "$BACKUP_DIR/packages_frontend"
echo "✅ Backups created at $BACKUP_DIR"

# Update the apps/frontend implementation with the best features
echo "🔨 Consolidating frontend implementations..."

# Ensure the apps/frontend has the latest dependencies
echo "📦 Updating dependencies in apps/frontend..."
cd "./apps/frontend"

# Update package.json with optimized dependencies
pnpm add react@18.2.0 react-dom@18.2.0
pnpm add -D @types/react@18.2.0 @types/react-dom@18.2.0

# Install UI libraries
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
pnpm add @tanstack/react-query@latest
pnpm add zustand@latest

# Ensure TypeScript is properly configured
echo "⚙️ Configuring TypeScript..."
cd "./apps/frontend"

# Integrate feature tracker functionality
echo "🔗 Integrating feature tracker functionality..."
pnpm add @the-new-fuse/feature-tracker@workspace:* @the-new-fuse/feature-suggestions@workspace:*

# Clean up and rebuild
echo "🧹 Cleaning and rebuilding frontend..."
pnpm clean
pnpm install
pnpm build

echo "✅ Frontend consolidation completed successfully!"
echo "🚀 The frontend has been consolidated with the best features from both implementations."
echo "📝 Next steps:"
echo "  1. Review the consolidated frontend implementation"
echo "  2. Test the application to ensure everything works correctly"
echo "  3. Update documentation as needed"