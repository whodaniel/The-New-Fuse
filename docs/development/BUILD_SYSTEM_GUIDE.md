# 🏗️ The New Fuse - Optimized Build System Guide

## Overview

The New Fuse framework features a production-optimized build system designed to
handle the complexity of a multi-agent orchestration monorepo with native
modules, TypeScript compilation, and cross-platform compatibility.

## 🚀 Quick Start Commands

### Health Check (Start Here!)

```bash
# Check if your system is ready for building
pnpm run build:health-check

# Or run the script directly
node scripts/build-health-check.cjs
```

### Optimized Build Commands

```bash
# Full optimized build with comprehensive error handling
pnpm run build:optimized

# Fast build (packages then apps)
pnpm run build:fast

# Verify existing build outputs
pnpm run build:verify

# Original memory-optimized build
pnpm run build
```

## 🔧 Build System Components

### 1. Core Scripts

| Script                       | Purpose                             | Usage                                                               |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `build-optimized.sh`         | Production-ready build with logging | `./scripts/build-optimized.sh [all\|clean\|packages\|apps\|verify]` |
| `build-health-check.cjs`     | System readiness verification       | `node scripts/build-health-check.cjs`                               |
| `setup-native-modules.cjs`   | Native module setup and validation  | `node scripts/setup-native-modules.cjs`                             |
| `memory-optimized-build.cjs` | Memory-constrained build strategy   | `node scripts/memory-optimized-build.cjs`                           |

### 2. TypeScript Optimizations

#### Electron Desktop

- **Incremental compilation** with `.tsbuildinfo` caching
- **Module resolution** set to `bundler` for renderer, `node` for main
- **Strict mode** enabled with selective relaxation of unused variable checks
- **Source maps** enabled for debugging
- **Decorator support** for future framework compatibility

#### API & Backend Services

- **Skip lib check** to speed up compilation
- **No emit on error** set to false to allow builds with warnings
- **Memory limits** applied via environment variables

### 3. Native Module Management

The build system automatically handles these critical native modules:

| Module            | Purpose                    | Status      |
| ----------------- | -------------------------- | ----------- |
| `drivelist`       | System drive enumeration   | ✅ Required |
| `node-pty`        | Terminal/PTY functionality | ✅ Required |
| `canvas`          | Graphics rendering         | ✅ Required |
| `@vscode/ripgrep` | Code search functionality  | ⚠️ Optional |

#### Native Module Setup Process

1. **Detection**: Checks if modules exist and are built
2. **Building**: Attempts to rebuild missing modules
3. **Fallback**: Copies from subdependencies if needed
4. **Validation**: Tests module functionality
5. **Graceful degradation**: Continues with warnings if optional modules fail

## 🎯 Build Strategies

### 1. Optimized Build (`build:optimized`)

**Best for: Production deployments, CI/CD**

- Full system health check before starting
- Native module setup and validation
- Dependency-ordered package building
- Comprehensive error logging
- Build artifact verification
- Performance report generation

**Configuration:**

```bash
export BUILD_MEMORY_LIMIT=4096
export BUILD_CONCURRENCY=2
export NODE_ENV=production
```

### 2. Fast Build (`build:fast`)

**Best for: Development, rapid iteration**

- Builds packages and apps separately
- Skips comprehensive health checks
- Uses Turbo caching aggressively
- Parallel execution where possible

### 3. Memory-Optimized Build (`build`)

**Best for: Resource-constrained environments**

- Adaptive memory management
- Sequential builds to reduce memory pressure
- Automatic cleanup between stages
- Conservative concurrency limits

## 📊 Performance Optimization Features

### Build Caching

- **Turbo caching**: Intelligent build result caching
- **TypeScript incremental**: `.tsbuildinfo` files for faster rebuilds
- **Node modules**: Persistent `node_modules` with smart invalidation

### Memory Management

```bash
# Environment variables for memory control
BUILD_MEMORY_LIMIT=4096      # Memory limit in MB
BUILD_CONCURRENCY=2          # Max concurrent builds
NODE_OPTIONS="--max-old-space-size=4096"  # Node.js heap size
```

### Parallel Execution

- **Package builds**: Core packages built before applications
- **Independent apps**: Frontend and backend built in parallel
- **Turbo orchestration**: Dependency-aware parallel builds

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Native Module Build Failures

```bash
# Symptom: "binding.gyp not found" errors
# Solution: Run native module setup
node scripts/setup-native-modules.cjs

# Alternative: Clean rebuild
rm -rf node_modules
pnpm install
```

#### 2. TypeScript Compilation Errors

```bash
# Symptom: Type compatibility errors
# Solution: Check TypeScript version consistency
pnpm run build:verify

# Check individual app configs
cd apps/api && tsc --noEmit
```

#### 3. Memory Issues

```bash
# Symptom: "JavaScript heap out of memory"
# Solution: Use low-memory build
BUILD_MEMORY_LIMIT=2048 BUILD_CONCURRENCY=1 pnpm run build

# Or increase Node.js heap
export NODE_OPTIONS="--max-old-space-size=8192"
```

#### 4. Turbo Cache Issues

```bash
# Symptom: Stale build outputs
# Solution: Clear Turbo cache
turbo clean

# Full clean rebuild
pnpm run build:optimized clean
```

### Health Check Diagnostics

Run the health check to diagnose system issues:

```bash
node scripts/build-health-check.cjs
```

**Health Check Categories:**

- ✅ **System Requirements**: Node.js, Bun, Turbo versions
- ✅ **Configuration**: Package.json, TypeScript configs
- ✅ **Native Modules**: Installation and build status
- ✅ **Resources**: Memory and disk space availability
- ✅ **Build Outputs**: Previous build verification

## 🚢 Production Deployment

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Build Health Check
  run: node scripts/build-health-check.cjs

- name: Setup Native Modules
  run: node scripts/setup-native-modules.cjs

- name: Optimized Build
  run: pnpm run build:optimized
  env:
    BUILD_MEMORY_LIMIT: 4096
    BUILD_CONCURRENCY: 2
    NODE_ENV: production

- name: Verify Build Outputs
  run: pnpm run build:verify
```

### Docker Build Strategy

```dockerfile
# Multi-stage build for optimized Docker images
FROM oven/bun:1.2-slim AS builder

WORKDIR /app
COPY package.json bun.lockb ./
COPY scripts/ scripts/

# Native modules setup
RUN node scripts/setup-native-modules.cjs

# Dependencies
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm run build:optimized

# Production image
FROM oven/bun:1.2-slim AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN pnpm install --production --frozen-lockfile
```

## 📈 Performance Metrics

### Build Performance Targets

| Metric              | Target      | Measurement            |
| ------------------- | ----------- | ---------------------- |
| **Cold build time** | < 5 minutes | Full monorepo build    |
| **Warm build time** | < 2 minutes | With Turbo cache       |
| **Memory usage**    | < 4GB peak  | During parallel builds |
| **Cache hit rate**  | > 80%       | Subsequent builds      |

### Monitoring

Build metrics are automatically collected and can be found in:

- `build-report-YYYYMMDD-HHMMSS.md` - Detailed build report
- `turbo-build.log` - Turbo execution log
- Individual app build logs in project root

## 🛠️ Advanced Configuration

### Custom Build Strategies

You can create custom build strategies by modifying:

- `BUILD_STRATEGY` environment variable
- Custom Turbo pipeline configurations
- Package-specific build scripts

### Environment Variables

```bash
# Build behavior
BUILD_STRATEGY=optimized|memory-optimized|staged
BUILD_MEMORY_LIMIT=4096
BUILD_CONCURRENCY=2
NODE_ENV=development|production

# Feature flags
BUILD_ENABLE_MONITORING=true
TURBO_TELEMETRY_DISABLED=1
SKIP_NATIVE_MODULES=false

# Debugging
DEBUG_BUILD=true
VERBOSE_LOGGING=true
```

### Package-Specific Overrides

Individual packages can override build behavior:

```json
{
  "scripts": {
    "build": "tsc --build --verbose",
    "build:memory-optimized": "tsc --build --incremental"
  }
}
```

## 🆘 Getting Help

1. **Run Health Check**: Start with `pnpm run build:health-check`
2. **Check Logs**: Review generated log files for specific errors
3. **Clean Build**: Try `./scripts/build-optimized.sh clean` for a fresh start
4. **Environment**: Verify all required tools are installed and up to date

---

## 🏆 Best Practices

1. **Always run health check** before starting development
2. **Use optimized build** for production deployments
3. **Monitor build logs** for warnings and optimization opportunities
4. **Keep native modules updated** for security and performance
5. **Use Turbo caching** to speed up development cycles

This build system is designed to scale with your development team while
maintaining reliability and performance. Happy building! 🚀
