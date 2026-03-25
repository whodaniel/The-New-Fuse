# Native Modules with Bun - Troubleshooting Guide

## Overview

This project uses Bun as the primary package manager and runtime, but some native modules (like `canvas`) have compatibility issues with Bun's installation process. This guide documents the hybrid approach we use to resolve these issues.

## The Problem

Bun sometimes fails to properly install or compile native modules, particularly:
- **Canvas** - HTML5 Canvas API for Node.js
- **Native addons** - Packages that require compilation of C/C++ code
- **Packages with complex build scripts** - Modules with custom installation procedures

### Symptoms
- Package appears in `package.json` but `node_modules/[package]` directory is missing
- Tests fail with "Cannot find module '[package].node'" errors
- Silent installation failures during `pnpm install`
- Native bindings not compiled properly

## The Solution: Hybrid Package Manager Approach

We use a hybrid approach that leverages the strengths of both package managers:
- **Bun** for fast runtime and most package installations
- **Node.js toolchain** for native module compilation when needed

## Project Native Module Inventory

### Core Modules
- **canvas** - HTML5 canvas support for server-side rendering
- **drivelist** - Drive enumeration for system integration
- **node-pty** - Pseudo-terminal support for SkIDEancer IDE
- **@vscode/ripgrep** - Fast text search functionality

### Optional Modules
- **keytar** - Secure credential storage
- **find-git-repositories** - Git repository discovery

## Step-by-Step Resolution

### 1. Environment Setup

Ensure you have a compatible Node.js version:
```bash
# Check current version
node --version

# Switch to Node.js 18.x (recommended for native modules)
nvm use 18.20.5

# Verify nvm is available
nvm list
```

### 2. Clean Installation

Remove existing problematic installations:
```bash
# Clean slate
rm -rf node_modules bun.lockb

# Install packages without running build scripts
pnpm install --ignore-scripts
```

### 3. Manual Native Module Compilation

For canvas specifically:
```bash
# Navigate to the canvas package
cd node_modules/canvas

# Compile native bindings using Node.js toolchain
node-gyp rebuild

# Return to project root
cd ../..
```

### 4. Verification

Test that the native module works with both runtimes:
```bash
# Test with Node.js
node -e "const { createCanvas } = require('canvas'); console.log('Canvas loaded successfully!'); const canvas = createCanvas(200, 200); console.log('Canvas created successfully!');"

# Test with Bun
bun -e "const { createCanvas } = require('canvas'); console.log('Canvas loaded successfully with Bun!'); const canvas = createCanvas(200, 200); console.log('Canvas created successfully with Bun!');"
```

## System Dependencies

### macOS
Install required system libraries via Homebrew:
```bash
brew install cairo pango libpng jpeg giflib librsvg
```

### Ubuntu/Debian
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

### CentOS/RHEL/Fedora
```bash
sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel
```

## Alternative Approaches

### Approach 1: Temporary npm Installation
```bash
# Temporarily switch package manager
# Edit package.json: "packageManager": "npm@10.8.2"
npm install

# Switch back to Bun
# Edit package.json: "packageManager": "bun@1.2.16"
pnpm test  # Use Bun for runtime
```

### Approach 2: Docker Development Environment
Use a containerized environment with pre-compiled native modules:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
# ... rest of Dockerfile
```

## Troubleshooting Common Issues

### Issue: node-gyp not found
```bash
# Install node-gyp globally
npm install -g node-gyp

# Or use via npx
npx node-gyp rebuild
```

### Issue: Python not found
```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install python3-dev

# Set Python version for node-gyp
npm config set python python3
```

### Issue: Compilation warnings about macOS version
This is usually safe to ignore. The warnings occur because system libraries were built for a newer macOS version, but the module will still work.

### Issue: Permission errors during compilation
```bash
# Fix permissions
sudo chown -R $(whoami) node_modules/

# Or use npm with --unsafe-perm
npm install --unsafe-perm
```

### Issue: drivelist module missing
```bash
Error: Cannot find module 'drivelist/build/Release/drivelist.node'
```

```bash
# Automatic fix
pnpm run setup:native-modules

# Manual fix
pnpm add drivelist --dev
```

### Issue: node-pty helper missing
```bash
Error: Cannot find module 'node-pty/build/Release/spawn-helper'
```

```bash
# Automatic fix
pnpm run setup:native-modules

# Manual fix
pnpm add node-pty --dev
```

### Issue: ripgrep binary missing
```bash
Error: Cannot find module '@vscode/ripgrep/bin/rg'
```

```bash
# Automatic fix
pnpm run setup:native-modules

# Manual fix
pnpm add @vscode/ripgrep --dev
```

## Best Practices

### 1. Version Pinning
Pin Node.js version in `.nvmrc`:
```bash
echo "18.20.5" > .nvmrc
```

### 2. CI/CD Considerations
In CI environments, use the hybrid approach:
```yaml
# GitHub Actions example
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18.20.5'

- name: Install dependencies
  run: |
    pnpm install --ignore-scripts
    cd node_modules/canvas && node-gyp rebuild && cd ../..
```

### 3. Documentation
Always document native module requirements in your README:
- System dependencies
- Node.js version requirements
- Installation steps

## Supported Native Modules

This approach has been tested with:
- ✅ **canvas** - HTML5 Canvas API
- ✅ **sharp** - Image processing
- ✅ **sqlite3** - SQLite bindings
- ✅ **bcrypt** - Password hashing
- ✅ **node-pty** - Pseudo terminal bindings

## Automated Integration

### Built-in Solutions
The project now includes automated native module handling:

- **`postinstall` script** - Automatically runs after `pnpm install` to detect and fix native module issues
- **`prebuild` checks** - Verifies native modules before building or testing  
- **Smart install script** - `pnpm run install:smart` for complete automated setup
- **Setup script** - `./scripts/setup-project.sh` for new developer onboarding

### Automatic Detection
The system automatically:
1. Detects when canvas or other native modules are missing or broken
2. Attempts to compile native bindings using the Node.js toolchain
3. Verifies functionality before proceeding with builds or tests
4. Provides clear guidance when manual intervention is needed

### Developer Experience
New developers can now simply run:
```bash
./scripts/setup-project.sh  # Complete automated setup
# OR
pnpm install                  # Automatic postinstall fixes

# Native module helpers
pnpm run setup:native-modules
pnpm run fix:native-modules
```

## Future Considerations

As Bun matures, native module support will improve. Monitor:
- [Bun GitHub Issues](https://github.com/oven-sh/bun/issues) for native module fixes
- Bun release notes for compatibility improvements
- Package-specific Bun compatibility updates

### When Manual Intervention May Be Needed
- System dependencies are missing (cairo, pango, etc.)
- Major Bun version updates that change native module handling
- New native modules are added to the project
- CI/CD environments with restricted compilation capabilities

## Getting Help

If you encounter issues with native modules:

1. **Check this guide first** for known solutions
2. **Search Bun GitHub issues** for similar problems
3. **Try the alternative approaches** documented above
4. **Document new solutions** and update this guide

## Contributing

When you discover new native module issues or solutions:

1. **Test the hybrid approach** with the problematic module
2. **Document the steps** that worked
3. **Update this guide** with the new information
4. **Add verification commands** for the module

This ensures the team has a reliable reference for handling native module compatibility issues.
