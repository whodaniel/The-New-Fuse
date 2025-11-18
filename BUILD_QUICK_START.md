# Build System Quick Start Guide

## Common Build Commands

### Full Build
```bash
# Clean and build everything
pnpm run build:production

# Build everything (no clean)
pnpm run build:all

# Build with verbose output
pnpm run build:production:verbose
```

### Railway Deployment
```bash
# Optimized build for Railway
pnpm run build:railway

# With verbose logging
pnpm run build:railway:verbose
```

### Component Builds
```bash
# Build only packages
pnpm run build:packages

# Build only apps
pnpm run build:apps

# Build specific app
pnpm run build:api
pnpm run build:frontend
pnpm run build:backend
```

### Verification
```bash
# Verify build outputs
pnpm run build:verify
```

## Quick Troubleshooting

### Problem: Build fails with "command not found"
**Solution:**
```bash
pnpm install --frozen-lockfile
```

### Problem: Build fails with memory error
**Solution:**
```bash
pnpm run build:railway
# or
pnpm run build:low-memory
```

### Problem: Build succeeds but app doesn't work
**Solution:**
```bash
pnpm run build:verify
pnpm run build:all:clean
```

### Problem: Need to see what's failing
**Solution:**
```bash
pnpm run build:production:verbose
```

## Environment Variables

```bash
# Production build
NODE_ENV=production pnpm run build:all

# Verbose logging
BUILD_VERBOSE=true pnpm run build:railway

# Skip frontend (API only)
BUILD_FRONTEND=false pnpm run build:railway

# Low memory mode
BUILD_MEMORY_LIMIT=1024 pnpm run build:all
```

## Build Order

The build system automatically handles dependencies:

1. **Types** → Foundation types and interfaces
2. **Infrastructure** → Core infrastructure
3. **Database** → Database models and clients
4. **Core** → Core business logic
5. **Common** → Common utilities
6. **Utils** → Helper utilities
7. **API Gateway** → Main API application
8. **Frontend** → Web application
9. **Backend** → Backend services

## When to Use Each Command

| Command | Use Case |
|---------|----------|
| `build:production` | Full production build with validation |
| `build:railway` | Deploying to Railway |
| `build:all` | Quick full build during development |
| `build:packages` | Only changed package code |
| `build:api` | Only changed API code |
| `build:frontend` | Only changed frontend code |
| `build:verify` | Check if build succeeded |

## More Information

See [BUILD_SYSTEM.md](BUILD_SYSTEM.md) for complete documentation.
