#!/bin/bash
set -e

echo "🔧 Starting consolidated dependency management..."

# Clean existing installations
bun clean

# ===== REACT DEPENDENCIES =====
echo "📦 Installing React dependencies..."
pnpm add react@18.2.0 react-dom@18.2.0
pnpm add -D @types/react@18.2.0 @types/react-dom@18.2.0

# Add React to workspace packages that need it
echo "📦 Adding React to workspace packages..."
bun --filter @the-new-fuse/database run add react@18.2.0 react-dom@18.2.0
bun --filter @the-new-fuse/ui run add react@18.2.0 react-dom@18.2.0
bun --filter @the-new-fuse/shared run add react@18.2.0 react-dom@18.2.0
bun --filter @the-new-fuse/core run add react@18.2.0 react-dom@18.2.0
bun --filter @the-new-fuse/types run add react@18.2.0 react-dom@18.2.0
bun --filter @the-new-fuse/feature-tracker run add react@18.2.0 react-dom@18.2.0

# Add React types to workspace packages
bun --filter @the-new-fuse/database run add -D @types/react@18.2.0 @types/react-dom@18.2.0
bun --filter @the-new-fuse/ui run add -D @types/react@18.2.0 @types/react-dom@18.2.0
bun --filter @the-new-fuse/shared run add -D @types/react@18.2.0 @types/react-dom@18.2.0
bun --filter @the-new-fuse/core run add -D @types/react@18.2.0 @types/react-dom@18.2.0
bun --filter @the-new-fuse/types run add -D @types/react@18.2.0 @types/react-dom@18.2.0
bun --filter @the-new-fuse/feature-tracker run add -D @types/react@18.2.0 @types/react-dom@18.2.0

# ===== FIREBASE DEPENDENCIES =====
echo "📦 Installing Firebase core dependencies..."
# Install core Firebase dependencies first
pnpm add @firebase/app@0.11.2
pnpm add @firebase/app-types@0.9.3
pnpm add @firebase/app-compat@0.2.0

# Install Firebase feature packages
echo "📦 Installing Firebase feature packages..."
pnpm add @firebase/analytics@0.10.12 \
  @firebase/auth@1.9.1 \
  @firebase/firestore@4.7.9 \
  @firebase/functions@0.12.3 \
  @firebase/storage@0.13.7 \
  @firebase/installations@0.6.13 \
  @firebase/messaging@0.12.17 \
  @firebase/performance@0.7.1 \
  @firebase/remote-config@0.6.0

# Install Firebase compat packages
echo "📦 Installing Firebase compat packages..."
pnpm add @firebase/analytics-compat@0.2.18 \
  @firebase/app-check-compat@0.2.17 \
  @firebase/auth-compat@0.2.24 \
  @firebase/firestore-compat@0.2.3 \
  @firebase/functions-compat@0.2.8 \
  @firebase/installations-compat@0.2.13 \
  @firebase/messaging-compat@0.2.17 \
  @firebase/performance-compat@0.2.14 \
  @firebase/remote-config-compat@0.2.13 \
  @firebase/storage-compat@0.3.17

# ===== INVERSIFY & REFLECT-METADATA =====
echo "📦 Installing Inversify and reflect-metadata..."
# @inversifyjs/core needs reflect-metadata as a peer dependency
pnpm add reflect-metadata@0.2.2
pnpm add @inversifyjs/core@1.3.5

# Add to specific workspaces that need it
bun --filter @the-new-fuse/api run add reflect-metadata@0.2.2
bun --filter @the-new-fuse/core run add reflect-metadata@0.2.2

# ===== CHAKRA UI DEPENDENCIES =====
echo "📦 Installing Chakra UI dependencies..."
pnpm add @chakra-ui/react @emotion/react @emotion/styled framer-motion

# ===== TYPEORM DEPENDENCIES =====
echo "📦 Fixing TypeORM dependencies..."
# Update MongoDB to a compatible version
bun --filter @the-new-fuse/api run add mongodb@^5.0.0
# Ensure TypeORM is using a compatible version
bun --filter @the-new-fuse/api run add typeorm@^0.3.0

# ===== TYPESCRIPT FIXES =====
echo "📦 Fixing TypeScript version..."
# Update TypeScript version in resolutions
bun config set resolutions.typescript "5.1.0"
# Update TypeScript in devDependencies
pnpm add -D typescript@5.1.0

# ===== CLEANUP AND REINSTALL =====
echo "🧹 Cleaning cache and reinstalling..."
bun pm cache rm
pnpm install

echo "✅ All dependencies installed and fixed successfully!"