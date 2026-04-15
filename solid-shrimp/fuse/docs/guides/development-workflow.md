# Development Workflow Guide

## Quick Start Commands

### Installation
```bash
# Install all dependencies with native module fixes
pnpm install
```

### Development

#### Option 1: With Docker Infrastructure (Recommended)
```bash
# Start PostgreSQL & Redis with Docker
pnpm run docker:start

# Start development servers
pnpm run dev:frontend    # React frontend (port 3000)
pnpm run dev:backend     # NestJS backend (port 3004) 
pnpm run dev:hub         # Electron app + Browser Hub

# Test Docker connectivity
pnpm run docker:test

# Check all service status
pnpm run docker:status
```

#### Option 2: Local Development Only
```bash
# Start development server with memory optimization (no Docker)
pnpm run dev

# Check build system status
pnpm run build:status
```

#### Docker Management
```bash
# Start Docker services
pnpm run docker:start

# Stop Docker services  
pnpm run docker:stop

# View Docker logs
pnpm run docker:logs

# Check service status
pnpm run docker:status
```

### Building
```bash
# Standard memory-optimized build (recommended)
pnpm run build

# Fast build for development
pnpm run build:fast

# Low memory build for constrained systems
pnpm run build:low-memory

# Staged build to prevent memory issues
pnpm run build:staged

# Simple fallback build
pnpm run build:simple
```

## Build System Features

### 🚀 Memory-Optimized Build Process
- **Automatic native module detection and fixing**
- **System resource detection and optimization**
- **Multiple fallback strategies**
- **Memory monitoring during builds**
- **Intelligent concurrency control**

### 🔧 Native Module Management
- **Automatic detection**: Checks for drivelist, keytar, node-pty, ripgrep
- **Automatic fixing**: Rebuilds missing native modules
- **Build integration**: Runs before every build and dev command
- **Status reporting**: Shows which modules are working

### 📊 Build Strategies
1. **Memory-Optimized** (default): Adapts to your system resources
2. **Fast**: Optimized for development speed
3. **Low-Memory**: For systems with limited RAM
4. **Staged**: Sequential builds to prevent memory exhaustion
5. **Simple**: Basic fallback build

## Native Module Management

### Automatic Setup and Verification
The build system includes comprehensive native module management:
- **Automatic Installation**: Required native modules installed during `pnpm install`
- **Pre-Build Verification**: All native modules checked before builds
- **Intelligent Repair**: Automatic fixing of common native module issues
- **Cross-Platform Support**: Handles macOS, Linux, and Windows differences

### Key Native Modules
- **canvas**: HTML5 canvas support (required for SkIDEancer IDE)
- **drivelist**: System drive enumeration  
- **node-pty**: Pseudo-terminal support (required for SkIDEancer IDE)
- **@vscode/ripgrep**: Fast text search functionality

### Setup Commands
```bash
# Automatic setup (runs during pnpm install)
pnpm install

# Manual native module setup
pnpm run setup:native-modules

# Legacy fix command  
pnpm run fix:native-modules
```

## Workflow Integration

### Enhanced Build Process
The build system automatically:
- Runs native module setup during `pnpm install` via postinstall hook
- Verifies all native modules before `pnpm run build`
- Attempts automatic repair if modules are missing
- Provides detailed error messages and fix suggestions

### Memory Management
- Detects available system memory
- Adjusts build concurrency automatically
- Monitors memory usage during builds
- Falls back to lower-memory strategies if needed

### Error Recovery
- Multiple fallback strategies
- Detailed error analysis
- Helpful recommendations
- Graceful degradation

## Troubleshooting

### Native Module Issues
```bash
# Check status
pnpm run build:status

# Fix native modules
pnpm run fix:native-modules

# Force rebuild
rm -rf node_modules && pnpm install
```

### Memory Issues
```bash
# Use low-memory build
pnpm run build:low-memory

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=8192" pnpm run build

# Use staged build
pnpm run build:staged
```

### Build Failures
```bash
# Check system status
pnpm run build:status

# Try simple build
pnpm run build:simple

# Clean and rebuild
pnpm run clean && pnpm install && pnpm run build
```

## Development Tips

### Performance
- Use `pnpm run build:fast` for quick development builds
- Use `pnpm run dev` for development with hot reload
- Check `pnpm run build:status` to verify system health

### Memory Optimization
- Close unnecessary applications during builds
- Use `pnpm run build:low-memory` on constrained systems
- Monitor system memory with `pnpm run build:status`

### Native Modules
- Native modules are automatically managed
- Check status with `pnpm run build:status`
- Force rebuild with `pnpm run fix:native-modules`

## Build System Architecture

### Components
- **Memory Monitor**: Tracks system resources
- **Build Orchestrator**: Manages build strategies
- **Native Module Manager**: Handles native dependencies
- **Fallback System**: Provides multiple build strategies

### Integration Points
- **Postinstall**: Automatic native module setup
- **Prebuild**: System verification
- **Build**: Memory-optimized compilation
- **Dev**: Development server with optimization

This system ensures reliable, efficient builds regardless of your system configuration!