#!/bin/bash
set -e

echo "🔧 Starting consolidated dependency management..."

# Clean existing installations
yarn clean

# ===== REACT DEPENDENCIES =====
echo "📦 Installing React dependencies..."
yarn add react@18.2.0 react-dom@18.2.0
yarn add -D @types/react@18.2.0 @types/react-dom@18.2.0

# Add React to workspace packages that need it
echo "📦 Adding React to workspace packages..."
yarn workspace @the-new-fuse/database add react@18.2.0 react-dom@18.2.0
yarn workspace @the-new-fuse/ui add react@18.2.0 react-dom@18.2.0
yarn workspace @the-new-fuse/shared add react@18.2.0 react-dom@18.2.0
yarn workspace @the-new-fuse/core add react@18.2.0 react-dom@18.2.0
yarn workspace @the-new-fuse/types add react@18.2.0 react-dom@18.2.0
yarn workspace @the-new-fuse/feature-tracker add react@18.2.0 react-dom@18.2.0

# Add React types to workspace packages
yarn workspace @the-new-fuse/database add -D @types/react@18.2.0 @types/react-dom@18.2.0
yarn workspace @the-new-fuse/ui add -D @types/react@18.2.0 @types/react-dom@18.2.0
yarn workspace @the-new-fuse/shared add -D @types/react@18.2.0 @types/react-dom@18.2.0
yarn workspace @the-new-fuse/core add -D @types/react@18.2.0 @types/react-dom@18.2.0
yarn workspace @the-new-fuse/types add -D @types/react@18.2.0 @types/react-dom@18.2.0
yarn workspace @the-new-fuse/feature-tracker add -D @types/react@18.2.0 @types/react-dom@18.2.0

# ===== FIREBASE DEPENDENCIES =====
echo "📦 Installing Firebase core dependencies..."
# Install core Firebase dependencies first
yarn add @firebase/app@0.11.2
yarn add @firebase/app-types@0.9.3
yarn add @firebase/app-compat@0.2.0

# Install Firebase feature packages
echo "📦 Installing Firebase feature packages..."
yarn add @firebase/analytics@0.10.12 \
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
yarn add @firebase/analytics-compat@0.2.18 \
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
yarn add reflect-metadata@0.2.2
yarn add @inversifyjs/core@1.3.5

# Add to specific workspaces that need it
yarn workspace @the-new-fuse/api add reflect-metadata@0.2.2
yarn workspace @the-new-fuse/core add reflect-metadata@0.2.2

# ===== CHAKRA UI DEPENDENCIES =====
echo "📦 Installing Chakra UI dependencies..."
yarn add @chakra-ui/react @emotion/react @emotion/styled framer-motion

# ===== TYPEORM DEPENDENCIES =====
echo "📦 Fixing TypeORM dependencies..."
# Update MongoDB to a compatible version
yarn workspace @the-new-fuse/api add mongodb@^5.0.0
# Ensure TypeORM is using a compatible version
yarn workspace @the-new-fuse/api add typeorm@^0.3.0

# ===== TYPESCRIPT FIXES =====
echo "📦 Fixing TypeScript version..."
# Update TypeScript version in resolutions
yarn config set resolutions.typescript "5.1.0"
# Update TypeScript in devDependencies
yarn add -D typescript@5.1.0

# ===== CLEANUP AND REINSTALL =====
echo "🧹 Cleaning cache and reinstalling..."
yarn cache clean
yarn install

echo "✅ All dependencies installed and fixed successfully!"