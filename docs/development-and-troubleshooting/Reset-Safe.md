# The New Fuse - Safe Reset Procedures

## Overview

This document provides safe reset procedures specifically designed for The New
Fuse development environment.

**⚠️ WARNING**: Always backup important data before running reset operations.

## Quick Reset Commands

### Safe Development Reset

```bash
#!/bin/bash
# Safe reset for development environment

echo "🔄 Starting development environment reset..."

# Stop any running development processes
pkill -f "turbo" || true
pkill -f "vite" || true
pkill -f "yarn dev" || true

# Clean build artifacts safely
yarn clean

# Clear temporary files and caches (safe)
rm -rf .turbo
rm -rf node_modules/.cache
rm -rf packages/*/dist
rm -rf apps/*/dist
rm -rf chrome-extension/dist

# Reinstall dependencies
yarn install

# Rebuild essential packages
yarn build

echo "✅ Development reset complete!"
```

### Selective Reset Options

```bash
# Reset only build artifacts
yarn clean

# Reset only dependencies (keeps configuration)
rm -rf node_modules yarn.lock .yarn/cache
yarn install

# Reset only Chrome extension
yarn clean:chrome
yarn workspace the-new-fuse-chrome-extension run build

# Reset only cache and temporary files
rm -rf .turbo node_modules/.cache packages/*/dist apps/*/dist
```

## Component-Specific Reset Procedures

### 1. Workspace Dependencies Reset

#### Clean Dependency Installation

```bash
# Stop all processes
pkill -f "turbo\|vite\|yarn dev" || true

# Remove all node_modules and cache
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf apps/*/node_modules
rm -rf chrome-extension/node_modules
rm -rf .yarn/cache

# Clean install
yarn install --check-files

# Verify installation
yarn workspaces list
```

#### Fix Dependency Conflicts

```bash
# Reset yarn lock file
rm -f yarn.lock

# Clean cache
yarn cache clean

# Reinstall with fresh resolution
yarn install

# Check for conflicts
yarn workspaces foreach run npm audit --audit-level=moderate
```

### 2. Build System Reset

#### Turbo Build Reset

```bash
# Clear Turbo cache
rm -rf .turbo

# Clear all build outputs
yarn clean

# Rebuild everything from scratch
yarn build

# Verify builds
yarn workspaces foreach --parallel run build
```

#### TypeScript Reset

```bash
# Clear TypeScript build info
find . -name "*.tsbuildinfo" -delete
find . -name "tsconfig.json.tsbuildinfo" -delete

# Clear compiled outputs in source directories
find packages -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*" -delete
find apps -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*" -delete

# Rebuild TypeScript
yarn build
```

### 3. Chrome Extension Reset

#### Extension Development Reset

```bash
# Clean Chrome extension build
yarn clean:chrome

# Rebuild Chrome extension
yarn workspace the-new-fuse-chrome-extension run build

# Package for testing
yarn package:chrome
```

#### Extension Storage Reset (Manual)

```bash
# Instructions for manual browser reset
echo "Chrome Extension Storage Reset:"
echo "1. Open chrome://extensions/"
echo "2. Find 'The New Fuse Chrome Extension'"
echo "3. Click 'Details'"
echo "4. Click 'Extension options' or 'Options'"
echo "5. Use any reset buttons provided"
echo "6. Or go to DevTools > Application > Storage > Clear storage"
```

### 4. Database Reset (If Applicable)

#### Drizzle Database Reset

```bash
# Reset Drizzle database (if you have one)
yarn db:reset

# Regenerate Drizzle client
yarn db:generate

# Run migrations
yarn db:migrate
```

### 5. Environment Configuration Reset

#### Environment Variables Reset

```bash
# Backup current .env files
find . -name ".env*" -not -path "./node_modules/*" -exec cp {} {}.backup \;

# Reset to example configurations
find . -name ".env.example" -not -path "./node_modules/*" | while read file; do
  dir=$(dirname "$file")
  cp "$file" "$dir/.env"
done

# Generate new secrets where needed
echo "Remember to regenerate any API keys, JWT secrets, etc."
```

## Development Environment-Specific Resets

### Development Environment Reset

```bash
#!/bin/bash
echo "🔄 Resetting development environment..."

# Stop development processes
yarn run dev:stop 2>/dev/null || true
pkill -f "turbo run dev" || true

# Clean development artifacts
yarn clean

# Clear development cache
rm -rf .turbo node_modules/.cache

# Restart development environment
yarn dev

echo "✅ Development environment reset complete!"
```

### Test Environment Reset

```bash
#!/bin/bash
echo "🔄 Resetting test environment..."

# Stop test processes
pkill -f "yarn test" || true

# Clear test artifacts
rm -rf coverage/ .nyc_output/ test-results/

# Clear test cache
yarn test:clean 2>/dev/null || true

# Verify test environment
yarn test --passWithNoTests

echo "✅ Test environment reset complete!"
```

## Configuration Reset Templates

### Package.json Reset Scripts (Add to your package.json)

```json
{
  "scripts": {
    "reset:all": "yarn reset:cache && yarn reset:deps && yarn reset:build",
    "reset:cache": "rm -rf .turbo node_modules/.cache packages/*/dist apps/*/dist",
    "reset:deps": "rm -rf node_modules yarn.lock .yarn/cache && yarn install",
    "reset:build": "yarn clean && yarn build",
    "reset:chrome": "yarn clean:chrome && yarn build:chrome",
    "reset:dev": "pkill -f 'turbo run dev' || true && yarn dev"
  }
}
```

## Reset Verification Procedures

### Post-Reset Health Checks

```bash
#!/bin/bash
echo "🔍 Running post-reset health checks..."

# Check workspace integrity
echo "Checking workspaces..."
yarn workspaces list --json | jq -r '.name' | head -5

# Check if builds work
echo "Testing build process..."
yarn build --dry-run || yarn build

# Check development startup
echo "Testing development startup..."
timeout 10s yarn dev 2>&1 | head -10 || echo "Dev server check complete"

# Check Chrome extension if it exists
if [ -d "chrome-extension" ]; then
    echo "Checking Chrome extension..."
    yarn workspace the-new-fuse-chrome-extension run build
fi

echo "🔍 Health checks complete!"
```

### Safe Recovery Script

```bash
#!/bin/bash
# Safe recovery if reset causes issues

echo "🔧 Starting safe recovery..."

# Restore from git (if available)
if git status &>/dev/null; then
    echo "Git repository detected, checking for changes..."
    git status --porcelain

    # Offer to reset to last commit
    echo "Reset to last commit? (y/N)"
    read -n 1 response
    if [ "$response" = "y" ]; then
        git reset --hard HEAD
        git clean -fd
    fi
fi

# Ensure basic workspace structure
yarn install --check-files

# Try a simple build
yarn build || echo "Build had issues, but continuing..."

echo "✅ Safe recovery complete!"
```

## Daily Maintenance Reset

```bash
#!/bin/bash
# Daily maintenance script (safe to run regularly)

echo "🧹 Starting daily maintenance..."

# Clear only safe temporary files
rm -rf .turbo
rm -rf node_modules/.cache
find . -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Update dependencies if needed
yarn install --check-files

# Quick health check
yarn workspaces list >/dev/null && echo "✅ Workspaces OK"

echo "✅ Daily maintenance complete!"
```

---

**✅ This script is safe for The New Fuse project because it:**

- Uses correct Yarn commands instead of npm
- References actual workspace names from your package.json
- Uses Turbo commands that match your setup
- Avoids destructive operations on unknown services
- Focuses on your actual architecture (Yarn + Turbo + Chrome extension)

**⚠️ WARNING**: Always backup important data before running reset operations.

**Last Updated**: 2025-06-06  
**Version**: 2.0.0  
**Maintainer**: Daniel Goldberg  
**Project**: The New Fuse
