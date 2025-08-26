# Development Workflow Guide

## Quick Start Commands

### Installation
```bash
# Install all dependencies with native module fixes
bun install
```

### Development

#### Option 1: With Docker Infrastructure (Recommended)
```bash
# Start PostgreSQL & Redis with Docker
bun run docker:start

# Start development servers
bun run dev:frontend    # React frontend (port 3000)
bun run dev:backend     # NestJS backend (port 3004) 
bun run dev:hub         # Electron app + Browser Hub

# Test Docker connectivity
bun run docker:test

# Check all service status
bun run docker:status
```

#### Option 2: Local Development Only
```bash
# Start development server with memory optimization (no Docker)
bun run dev

# Check build system status
bun run build:status
```

#### Docker Management
```bash
# Start Docker services
bun run docker:start

# Stop Docker services  
bun run docker:stop

# View Docker logs
bun run docker:logs

# Check service status
bun run docker:status
```

### Building
```bash
# Standard memory-optimized build (recommended)
bun run build

# Fast build for development
bun run build:fast

# Low memory build for constrained systems
bun run build:low-memory

# Staged build to prevent memory issues
bun run build:staged

# Simple fallback build
bun run build:simple
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
- **Automatic Installation**: Required native modules installed during `bun install`
- **Pre-Build Verification**: All native modules checked before builds
- **Intelligent Repair**: Automatic fixing of common native module issues
- **Cross-Platform Support**: Handles macOS, Linux, and Windows differences

### Key Native Modules
- **canvas**: HTML5 canvas support (required for Theia IDE)
- **drivelist**: System drive enumeration  
- **node-pty**: Pseudo-terminal support (required for Theia IDE)
- **@vscode/ripgrep**: Fast text search functionality

### Setup Commands
```bash
# Automatic setup (runs during bun install)
bun install

# Manual native module setup
bun run setup:native-modules

# Legacy fix command  
bun run fix:native-modules
```

## Workflow Integration

### Enhanced Build Process
The build system automatically:
- Runs native module setup during `bun install` via postinstall hook
- Verifies all native modules before `bun run build`
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
bun run build:status

# Fix native modules
bun run fix:native-modules

# Force rebuild
rm -rf node_modules && bun install
```

### Memory Issues
```bash
# Use low-memory build
bun run build:low-memory

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=8192" bun run build

# Use staged build
bun run build:staged
```

### Build Failures
```bash
# Check system status
bun run build:status

# Try simple build
bun run build:simple

# Clean and rebuild
bun run clean && bun install && bun run build
```

## Development Tips

### Performance
- Use `bun run build:fast` for quick development builds
- Use `bun run dev` for development with hot reload
- Check `bun run build:status` to verify system health

### Memory Optimization
- Close unnecessary applications during builds
- Use `bun run build:low-memory` on constrained systems
- Monitor system memory with `bun run build:status`

### Native Modules
- Native modules are automatically managed
- Check status with `bun run build:status`
- Force rebuild with `bun run fix:native-modules`

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