# Production Build System Documentation

## Overview

The New Fuse monorepo now has a comprehensive, production-ready build system
that works both locally and on CloudRuntime. The build system intelligently handles
dependency ordering, validates outputs, and provides detailed build reports.

## Build Scripts

### Core Build Scripts

#### `pnpm run build:all`

Builds all packages and applications in the correct dependency order.

```bash
pnpm run build:all
```

- Validates environment (pnpm, turbo)
- Builds all shared packages
- Builds all applications
- Validates build outputs
- Prints detailed build summary

#### `pnpm run build:all:clean`

Same as `build:all` but cleans previous builds first.

```bash
pnpm run build:all:clean
```

#### `pnpm run build:production`

Production build with clean and validation.

```bash
pnpm run build:production
```

#### `pnpm run build:production:verbose`

Production build with verbose logging for debugging.

```bash
pnpm run build:production:verbose
```

### CloudRuntime-Specific Build

#### `pnpm run build:cloud_runtime`

Optimized build for CloudRuntime deployment - only builds what's needed.

```bash
pnpm run build:cloud_runtime
```

**What it builds:**

- Core packages (types, infrastructure, database, core, common, utils)
- API Gateway (required)
- Frontend (optional, controlled by `BUILD_FRONTEND` env var)

**Features:**

- Skips test packages and dev-only packages
- Memory efficient
- Faster than full build
- Designed for CloudRuntime's resource constraints

**Environment Variables:**

- `BUILD_VERBOSE=true` - Enable verbose logging
- `BUILD_FRONTEND=false` - Skip frontend build (API-only deployments)

### Component-Specific Builds

#### `pnpm run build:packages`

Build all shared packages only.

```bash
pnpm run build:packages
```

#### `pnpm run build:apps`

Build all applications only (requires packages to be built first).

```bash
pnpm run build:apps
```

#### `pnpm run build:api`

Build only the API Gateway.

```bash
pnpm run build:api
```

#### `pnpm run build:frontend`

Build only the Frontend application.

```bash
pnpm run build:frontend
```

#### `pnpm run build:backend`

Build only the Backend application.

```bash
pnpm run build:backend
```

### Verification and Validation

#### `pnpm run build:verify`

Verify that all expected build outputs exist.

```bash
pnpm run build:verify
```

Checks for:

- `apps/api-gateway/dist` (critical)
- `apps/frontend/dist` (optional)
- `packages/core/dist` (optional)
- `packages/types` (optional)

## Build System Architecture

### Files

#### `/scripts/build-production.cjs`

Comprehensive build orchestrator with:

- Environment validation
- Dependency installation checks
- Sequential package and app building
- Output validation
- Detailed error reporting
- Build summary generation

**Command Line Options:**

```bash
node scripts/build-production.cjs [options]

Options:
  --clean           Clean previous builds before building
  --packages-only   Build only packages
  --apps-only       Build only apps (requires packages built)
  --verbose         Enable verbose logging
  --skip-validation Skip build output validation
```

#### `/scripts/build-cloud_runtime.cjs`

CloudRuntime-optimized build script:

- Builds only essential packages
- Memory efficient
- Faster execution
- Designed for CI/CD pipelines

#### `/scripts/verify-build.cjs`

Build verification script:

- Checks for build output directories
- Validates critical outputs
- Returns appropriate exit codes
- Used in CI/CD pipelines

### Dockerfile Integration

The CloudRuntime Dockerfile (`/Dockerfile.cloud_runtime`) uses the build system:

```dockerfile
# Build packages and API Gateway using CloudRuntime-optimized build
ENV NODE_ENV=production
ENV BUILD_VERBOSE=true
RUN pnpm run build:cloud_runtime || (echo "Build failed" && exit 1)
```

## Dependency Order

The build system respects Turbo's dependency graph via the `^build` dependency:

```
Packages (in dependency order):
  └─ types
  └─ infrastructure
  └─ database
  └─ core
  └─ common
  └─ utils
  └─ ... (other packages)

Applications (depend on packages):
  └─ api-gateway
  └─ frontend
  └─ backend
```

Turbo automatically builds packages in the correct order based on workspace
dependencies.

## Usage Examples

### Local Development

#### Full clean build

```bash
pnpm run build:production
```

#### Quick rebuild after changes

```bash
pnpm run build:all
```

#### Build and verify

```bash
pnpm run build:all && pnpm run build:verify
```

#### Debug build issues

```bash
pnpm run build:production:verbose
```

### CI/CD Pipeline

#### CloudRuntime deployment

```bash
pnpm run build:cloud_runtime
```

#### Build verification in CI

```bash
pnpm run build:all
pnpm run build:verify
```

### Targeted Builds

#### Only rebuild packages

```bash
pnpm run build:packages
```

#### Only rebuild API after package changes

```bash
pnpm run build:api
```

#### Rebuild everything from scratch

```bash
pnpm run build:all:clean
```

## Build Output Structure

After a successful build:

```
apps/
├─ api-gateway/
│  └─ dist/            # Compiled API Gateway
│     ├─ main.js
│     └─ ... (other files)
├─ frontend/
│  └─ dist/            # Compiled Frontend
│     ├─ index.html
│     └─ assets/
└─ backend/
   └─ dist/            # Compiled Backend

packages/
├─ core/
│  └─ dist/            # Compiled Core package
├─ types/
│  └─ src/             # Types build to src (see note)
└─ ... (other packages)
```

**Note:** Some packages like `types` may output to different directories. The
build system handles this automatically.

## Environment Variables

### Build Configuration

- `NODE_ENV` - Set to 'production' for production builds
- `BUILD_VERBOSE` - Enable verbose logging (true/false)
- `BUILD_FRONTEND` - Control frontend building (true/false)
- `BUILD_MEMORY_LIMIT` - Memory limit for builds (MB)
- `BUILD_CONCURRENCY` - Number of concurrent builds

### Turbo Configuration

- `BUILD_STRATEGY` - Build strategy (memory-optimized, staged, etc.)
- `BUILD_ENABLE_MONITORING` - Enable build monitoring
- `BUILD_STAGE` - Current build stage

## Troubleshooting

### Build fails with dependency errors

**Solution:** Ensure dependencies are installed

```bash
pnpm install --frozen-lockfile
pnpm run build:all
```

### Build fails with memory errors

**Solution:** Use memory-optimized build

```bash
pnpm run build:low-memory
```

Or use CloudRuntime build:

```bash
pnpm run build:cloud_runtime
```

### Build succeeds but verification fails

**Solution:** Check which outputs are missing

```bash
pnpm run build:verify
```

Then rebuild specific components:

```bash
pnpm run build:api
# or
pnpm run build:frontend
```

### TypeScript compilation errors

**Solution:** Type check before building

```bash
pnpm run type-check
```

Fix errors, then rebuild:

```bash
pnpm run build:all
```

### Turbo cache issues

**Solution:** Clear cache and rebuild

```bash
pnpm run clean:cache
pnpm run build:all:clean
```

## Best Practices

### For Local Development

1. Use `pnpm run build:all` for regular builds
2. Use `pnpm run build:all:clean` when switching branches
3. Use component-specific builds for faster iteration
4. Run `pnpm run build:verify` to check build health

### For CI/CD

1. Always use `build:cloud_runtime` for CloudRuntime deployments
2. Set `BUILD_VERBOSE=true` for debugging
3. Use `build:verify` to validate build outputs
4. Set appropriate memory limits for your environment

### For Production Deployments

1. Use `build:production` for full validation
2. Always verify build outputs
3. Use verbose mode for debugging failures
4. Monitor build times and optimize as needed

## Performance

### Build Times (Approximate)

- **Full clean build:** 2-3 minutes
- **Incremental build:** 30-60 seconds
- **CloudRuntime build:** 60-90 seconds
- **Package-only build:** 30-45 seconds
- **App-only build:** 20-30 seconds

### Memory Usage

- **Full build:** ~2-4 GB
- **CloudRuntime build:** ~1-2 GB
- **Low-memory build:** ~512 MB - 1 GB

## Future Improvements

- [ ] Parallel package building (when safe)
- [ ] Incremental builds with better caching
- [ ] Build time analytics and reporting
- [ ] Automated build optimization suggestions
- [ ] Integration with monitoring tools
- [ ] Build artifact management

## Support

For issues or questions about the build system:

1. Check this documentation
2. Run build with `--verbose` flag
3. Check build output in `BUILD_STATUS.md`
4. Review Turbo logs in `.turbo/`
5. Contact the platform team

## Related Documentation

- [Deployment Guide](../deployment/DEPLOYMENT.md)
- [CloudRuntime Setup](CLOUD_RUNTIME_SETUP_COMMANDS.sh)
- [Package Manager Guide](README.md#package-manager)
- [Turbo Configuration](turbo.json)
