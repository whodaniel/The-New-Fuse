# Build Optimization Guide

This guide explains how to use the memory-efficient build system in The New Fuse monorepo.

## Overview

The build optimization system provides memory-aware build strategies that automatically adjust concurrency and resource usage based on your system's capabilities. This prevents out-of-memory errors and improves build reliability on resource-constrained systems.

## Available Build Commands

### Production Builds

#### `npm run build:adaptive`
**Recommended for most users**
- Automatically detects system resources and selects optimal build strategy
- Provides detailed metrics and recommendations
- Uses the build orchestration system for intelligent resource management

```bash
npm run build:adaptive
```

#### `npm run build:memory-optimized`
- Uses memory-optimized settings with reduced concurrency
- Suitable for systems with 4-8GB RAM
- Memory limit: 2048MB, Concurrency: 2

```bash
npm run build:memory-optimized
```

#### `npm run build:low-memory`
- Designed for systems with 2-4GB RAM
- Memory limit: 1024MB, Concurrency: 1
- Sequential builds with memory cleanup between stages

```bash
npm run build:low-memory
```

#### `npm run build:staged`
- For very low memory systems (<2GB RAM)
- Builds packages in 3 sequential stages
- Maximum memory efficiency with longer build times

```bash
npm run build:staged
```

#### `npm run build:with-monitoring`
- Standard build with detailed memory monitoring
- Provides real-time memory usage feedback
- Useful for debugging memory issues

```bash
npm run build:with-monitoring
```

### Development Commands

#### `npm run dev:memory-optimized`
**Recommended for development**
- Automatically adjusts services based on available memory
- Includes memory monitoring and warnings
- Optimizes for development workflow

```bash
npm run dev:memory-optimized
```

#### `npm run dev:low-memory`
- Minimal service set for low-memory systems
- Starts only essential services (API Gateway + Frontend)
- Memory limit: 1024MB

```bash
npm run dev:low-memory
```

### Testing Commands

#### `npm run test:memory-optimized`
- Runs tests with memory-aware concurrency
- Suitable for CI/CD environments with limited resources

```bash
npm run test:memory-optimized
```

#### `npm run test:low-memory`
- Sequential test execution for very low memory systems
- Prevents test failures due to memory exhaustion

```bash
npm run test:low-memory
```

### Utility Commands

#### `npm run build:analyze-memory`
- Analyzes current system memory and provides recommendations
- Shows available memory, CPU cores, and optimal settings

```bash
npm run build:analyze-memory
```

#### `npm run build:recommend-strategy`
- Recommends the best build strategy for your system
- Considers current memory usage and system specifications

```bash
npm run build:recommend-strategy
```

#### `npm run build:monitor`
- Runs standard build with verbose monitoring
- Logs detailed memory usage throughout the build process

```bash
npm run build:monitor
```

#### `npm run build:benchmark`
- Benchmarks different build strategies on your system
- Compares build times and memory usage

```bash
npm run build:benchmark
```

#### `npm run build:cleanup`
- Forces memory cleanup and garbage collection
- Useful after failed builds or before starting new builds

```bash
npm run build:cleanup
```

#### `npm run build:health-check`
- Comprehensive system check including memory analysis, type checking, and testing
- Recommended before important builds

```bash
npm run build:health-check
```

## Environment Variables

### Core Configuration

- `BUILD_STRATEGY`: Force specific strategy (`memory-optimized`, `staged`, `low-memory`)
- `BUILD_MEMORY_LIMIT`: Memory limit in MB (e.g., `2048`)
- `BUILD_CONCURRENCY`: Maximum concurrent processes (e.g., `2`)
- `BUILD_ENABLE_MONITORING`: Enable detailed monitoring (`true`/`false`)

### Advanced Configuration

- `BUILD_STAGE`: For staged builds, specify stage number (`1`, `2`, `3`)
- `BUILD_LOG_LEVEL`: Logging verbosity (`verbose`, `normal`, `quiet`)
- `NODE_OPTIONS`: Node.js options (e.g., `--max-old-space-size=4096`)

## Usage Examples

### Basic Usage
```bash
# Let the system choose the best strategy
npm run build:adaptive

# Force low-memory build
npm run build:low-memory

# Development with memory optimization
npm run dev:memory-optimized
```

### Custom Configuration
```bash
# Build with custom memory limit
BUILD_MEMORY_LIMIT=3072 npm run build:memory-optimized

# Development with specific concurrency
BUILD_CONCURRENCY=1 npm run dev:memory-optimized

# Enable monitoring for any build
BUILD_ENABLE_MONITORING=true npm run build
```

### CI/CD Usage
```bash
# For GitHub Actions with 7GB RAM
BUILD_MEMORY_LIMIT=4096 BUILD_CONCURRENCY=2 npm run build:memory-optimized

# For resource-constrained CI
npm run build:low-memory

# With health check
npm run build:health-check && npm run build:adaptive
```

## Troubleshooting

### Out of Memory Errors

If you encounter out-of-memory errors:

1. **Try lower memory builds:**
   ```bash
   npm run build:low-memory
   # or
   npm run build:staged
   ```

2. **Check system resources:**
   ```bash
   npm run build:analyze-memory
   ```

3. **Close other applications** to free memory

4. **Use Node.js memory options:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

### Slow Builds

If builds are too slow:

1. **Check if you're using the right strategy:**
   ```bash
   npm run build:recommend-strategy
   ```

2. **Try higher concurrency** (if you have enough memory):
   ```bash
   BUILD_CONCURRENCY=4 npm run build:memory-optimized
   ```

3. **Use standard build** if you have plenty of memory:
   ```bash
   npm run build
   ```

### Build Failures

For general build failures:

1. **Run health check:**
   ```bash
   npm run build:health-check
   ```

2. **Clean and retry:**
   ```bash
   npm run clean && npm run build:adaptive
   ```

3. **Check with monitoring:**
   ```bash
   npm run build:with-monitoring
   ```

## System Requirements

### Minimum Requirements
- **RAM:** 2GB (use `build:staged`)
- **CPU:** 2 cores
- **Node.js:** 18+
- **Disk:** 10GB free space

### Recommended Requirements
- **RAM:** 8GB (use `build:memory-optimized`)
- **CPU:** 4+ cores
- **Node.js:** 20+
- **Disk:** 20GB free space

### Optimal Requirements
- **RAM:** 16GB+ (use standard `build`)
- **CPU:** 8+ cores
- **Node.js:** 20+
- **Disk:** 50GB+ free space

## Configuration Files

The build optimization system uses several configuration files:

- `turbo.json` - Standard Turbo configuration with memory-optimized tasks
- `turbo.memory-optimized.json` - Memory-optimized Turbo configuration
- `turbo.staged.json` - Staged build configuration for very low memory
- `build-optimization.config.js` - Advanced build optimization settings (optional)

## Performance Tips

1. **Use the right strategy for your system** - run `npm run build:recommend-strategy`
2. **Close unnecessary applications** during builds
3. **Use SSD storage** for faster I/O
4. **Keep Node.js updated** for better memory management
5. **Monitor memory usage** with `BUILD_ENABLE_MONITORING=true`
6. **Clean build artifacts regularly** with `npm run clean`

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Build with memory optimization
  run: |
    npm run build:analyze-memory
    npm run build:memory-optimized
  env:
    BUILD_MEMORY_LIMIT: 4096
    BUILD_CONCURRENCY: 2
```

### Docker
```dockerfile
# Set memory limits for build
ENV BUILD_MEMORY_LIMIT=2048
ENV BUILD_CONCURRENCY=2
RUN npm run build:memory-optimized
```

### Local Development
Add to your `.bashrc` or `.zshrc`:
```bash
# Set default build optimization
export BUILD_MEMORY_LIMIT=4096
export BUILD_CONCURRENCY=4
export BUILD_ENABLE_MONITORING=true
```