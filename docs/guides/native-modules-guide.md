# Native Modules Setup Guide

## Overview

The New Fuse project requires several native modules that must be compiled for your specific system architecture. This guide covers the automated setup process and troubleshooting for native module issues.

## Required Native Modules

The following native modules are required for full functionality:

### Core Modules
- **canvas** - HTML5 canvas support for server-side rendering
- **drivelist** - Drive enumeration for system integration
- **node-pty** - Pseudo-terminal support for Theia IDE
- **@vscode/ripgrep** - Fast text search functionality

### Optional Modules
- **keytar** - Secure credential storage
- **find-git-repositories** - Git repository discovery

## Automated Setup

### Quick Start
The project includes automated native module setup that runs during installation:

```bash
# Fresh installation (includes native module setup)
pnpm install

# Manual native module setup
pnpm run setup:native-modules

# Legacy native module fix
pnpm run fix:native-modules
```

### Build Process Integration
The build system automatically checks and fixes native modules:

```bash
# Build with automatic native module verification
pnpm run build

# If build fails, the system will:
# 1. Detect missing native modules
# 2. Attempt automatic repair
# 3. Provide clear error messages if manual intervention is needed
```

## How the Automated System Works

### 1. Installation Hook
When you run `pnpm install`, the postinstall script automatically:
- Runs the standard postinstall tasks
- Executes `scripts/setup-native-modules.cjs`
- Verifies all required modules are properly built

### 2. Pre-Build Verification
Before every build, the system:
- Checks all required native modules exist
- Tests critical modules (like canvas) are functional
- Automatically runs repairs if issues are detected
- Provides detailed error messages for manual fixes

### 3. Intelligent Module Location
The setup script handles common native module issues:
- **Subdependency Discovery**: Finds modules installed as subdependencies
- **Binary Relocation**: Copies compiled binaries to correct locations
- **Rebuild Automation**: Automatically rebuilds modules when needed
- **Cross-Platform Support**: Handles macOS, Linux, and Windows differences

## Manual Troubleshooting

### Common Issues and Solutions

#### Issue 1: Canvas Module Missing
```bash
Error: Cannot find module '../build/Release/canvas.node'
```

**Solution:**
```bash
# Automatic fix
pnpm run setup:native-modules

# Manual fix
cd node_modules/canvas && node-gyp rebuild
```

#### Issue 2: Drivelist Module Missing
```bash
Error: Cannot find module 'drivelist/build/Release/drivelist.node'
```

**Solution:**
```bash
# Automatic fix  
pnpm run setup:native-modules

# Manual fix
pnpm add drivelist --dev
```

#### Issue 3: Node-PTY Missing
```bash
Error: Cannot find module 'node-pty/build/Release/spawn-helper'
```

**Solution:**
```bash
# Automatic fix
pnpm run setup:native-modules

# Manual fix
pnpm add node-pty --dev
```

#### Issue 4: Ripgrep Binary Missing
```bash
Error: Cannot find module '@vscode/ripgrep/bin/rg'
```

**Solution:**
```bash
# Automatic fix
pnpm run setup:native-modules

# Manual fix
pnpm add @vscode/ripgrep --dev
```

### Advanced Troubleshooting

#### Clean Rebuild
If you encounter persistent issues:

```bash
# Complete clean rebuild
pnpm run clean:all
pnpm install

# Or step by step
rm -rf node_modules
pnpm install
pnpm run setup:native-modules
```

#### Node.js Version Issues
Native modules are sensitive to Node.js versions:

```bash
# Check Node.js version
node --version

# Recommended: Use Node.js 18.x for best compatibility
nvm use 18
pnpm install
```

#### Architecture Mismatches
On Apple Silicon Macs or other architectures:

```bash
# Force rebuild for current architecture
pnpm run setup:native-modules

# Or manually for specific modules
cd node_modules/canvas && node-gyp rebuild --arch=arm64
```

## Development Workflow Integration

### Pre-Development Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd the-new-fuse

# 2. Install dependencies (automatic native module setup)
pnpm install

# 3. Verify everything works
pnpm run build
```

### Continuous Integration
For CI/CD pipelines, ensure native modules are properly handled:

```yaml
# GitHub Actions example
- name: Install dependencies
  run: pnpm install

- name: Verify native modules
  run: pnpm run setup:native-modules

- name: Build project
  run: pnpm run build
```

### Docker Integration
When using Docker, native modules need special handling:

```dockerfile
# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    node-gyp \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

# Install and setup
COPY package.json bun.lock ./
RUN pnpm install
RUN pnpm run setup:native-modules
```

## Monitoring and Diagnostics

### Health Check Commands
```bash
# Quick health check
pnpm run setup:native-modules

# Full build verification
pnpm run build

# Individual module testing
node -e "const { createCanvas } = require('canvas'); console.log('Canvas OK');"
node -e "const drivelist = require('drivelist'); console.log('Drivelist OK');"
```

### Debug Information
The setup script provides detailed logging:

```bash
# Run with verbose output
DEBUG=* pnpm run setup:native-modules

# Check specific module status
ls -la node_modules/canvas/build/Release/
ls -la node_modules/node-pty/build/Release/
ls -la node_modules/@vscode/ripgrep/bin/
```

## Performance Considerations

### Build Time Optimization
- Native modules are only rebuilt when necessary
- Pre-built binaries are used when available
- Parallel compilation where supported

### Memory Usage
- Build processes are memory-optimized
- Automatic fallback to lower-memory strategies
- Progress monitoring and resource management

## Platform-Specific Notes

### macOS
- Xcode Command Line Tools required
- Apple Silicon vs Intel considerations handled automatically
- Homebrew dependencies may be needed for canvas (cairo, pango, etc.)

### Linux
- Build-essential package required
- System libraries needed: libcairo2-dev, libpango1.0-dev, libjpeg-dev
- Distribution-specific package managers supported

### Windows
- Visual Studio Build Tools required
- Python 3.x installation needed
- Windows SDK components may be required

## Integration with Build System

The native module system is integrated with:
- **Turbo**: Monorepo build orchestration
- **TypeScript**: Type checking and compilation
- **Webpack**: Theia IDE bundling
- **Prisma**: Database client generation

All these systems respect native module dependencies and will trigger setup when needed.

## Future Enhancements

Planned improvements to the native module system:
1. **Pre-built Binary Distribution**: Reduce compilation time
2. **Cross-Compilation Support**: Build for multiple architectures
3. **Module Caching**: Cache compiled modules across builds
4. **Health Monitoring**: Real-time status of native modules
5. **Automatic Updates**: Keep native modules up to date

## Support and Troubleshooting

If you encounter issues not covered in this guide:

1. **Check Logs**: Review the detailed output from setup scripts
2. **System Requirements**: Ensure you have necessary build tools
3. **Clean Install**: Try a complete clean installation
4. **Architecture Match**: Verify Node.js and system architecture compatibility
5. **Report Issues**: Include full error messages and system information

For additional support, include this information in your reports:
```bash
# System information
node --version
bun --version
npm config get registry
uname -a  # or systeminfo on Windows

# Module status
ls -la node_modules/*/build/Release/ 2>/dev/null | head -20
pnpm run setup:native-modules
```