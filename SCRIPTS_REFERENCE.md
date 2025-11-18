# Scripts Reference Guide

Complete reference for all npm/pnpm scripts in The New Fuse monorepo.

## Table of Contents

- [Overview](#overview)
- [Root Scripts](#root-scripts)
- [Standard Package Scripts](#standard-package-scripts)
- [Script Naming Conventions](#script-naming-conventions)
- [Turbo Tasks](#turbo-tasks)
- [Pre/Post Hooks](#prepost-hooks)
- [Best Practices](#best-practices)

## Overview

This monorepo uses **Turborepo** for task orchestration and **pnpm** for package management. Scripts are standardized across all packages to ensure consistency and ease of use.

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development (API Gateway + Frontend)
pnpm dev

# Build everything
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format:check
```

## Root Scripts

Run these from the monorepo root (`/home/user/fuse`):

### Development

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm dev` | Start API Gateway + Frontend | Main development mode |
| `pnpm dev:all` | Start all apps concurrently | Full system development |
| `pnpm dev:api` | Start API server only | Backend API development |
| `pnpm dev:gateway` | Start API Gateway only | Gateway development |
| `pnpm dev:frontend` | Start Frontend only | Frontend development |
| `pnpm dev:backend` | Start Backend app only | Backend app development |
| `pnpm dev:memory-optimized` | Dev with memory optimizations | Low-resource environments |
| `pnpm dev:low-memory` | Dev with minimal memory | Very constrained environments |

### Building

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm build` | Build all packages and apps | Production builds |
| `pnpm build:packages` | Build packages only | Package development |
| `pnpm build:apps` | Build apps only | App development |
| `pnpm build:types` | Build type definitions | Type-only builds |
| `pnpm build:api` | Build API Gateway | Specific app build |
| `pnpm build:frontend` | Build Frontend | Specific app build |
| `pnpm build:backend` | Build Backend | Specific app build |
| `pnpm build:production` | Clean + optimized production build | Deployment preparation |
| `pnpm build:railway` | Railway-specific build | Railway deployment |
| `pnpm build:clean` | Clean + fresh build | After dependency changes |
| `pnpm build:memory-optimized` | Build with memory limits | Constrained environments |

### Testing

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm test` | Run all tests | Full test suite |
| `pnpm test:all` | Run all tests (parallel) | CI/CD pipeline |
| `pnpm test:unit` | Run unit tests only | Package testing |
| `pnpm test:integration` | Run integration tests | App testing |
| `pnpm test:e2e` | Run end-to-end tests | Full system testing |
| `pnpm test:watch` | Run tests in watch mode | Active development |
| `pnpm test:coverage` | Run tests with coverage | Code quality checks |

### Linting & Formatting

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm lint` | Lint all packages | Check code quality |
| `pnpm lint:fix` | Lint and auto-fix | Fix linting issues |
| `pnpm lint:staged` | Lint staged files only | Pre-commit hook |
| `pnpm format` | Format all packages | Run prettier on packages |
| `pnpm format:check` | Check formatting | CI/CD validation |
| `pnpm format:root` | Format root files | Format config files |
| `pnpm format:check:root` | Check root formatting | Root file validation |

### Type Checking

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm type-check` | Type check all packages | TypeScript validation |
| `pnpm type-check:watch` | Watch mode type checking | Active development |

### Maintenance

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm clean` | Remove build artifacts | Fresh start |
| `pnpm clean:all` | Remove all node_modules | Deep clean |
| `pnpm clean:cache` | Clear Turbo cache | Cache issues |
| `pnpm clean:deps` | Remove all dependencies | Dependency reset |

### Database

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm db:generate` | Generate Prisma client | After schema changes |
| `pnpm db:migrate` | Run migrations | Database updates |
| `pnpm db:reset` | Reset database | Development reset |
| `pnpm db:studio` | Open Prisma Studio | Database UI |

### Docker

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm docker:start` | Start Docker services | Development services |
| `pnpm docker:stop` | Stop Docker services | Cleanup |
| `pnpm docker:status` | Check service status | Debugging |
| `pnpm docker:logs` | View service logs | Monitoring |

### Utilities

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm clear-ports` | Kill processes on used ports | Port conflicts |
| `pnpm health-check` | Full system health check | CI/CD validation |
| `pnpm audit:security` | Security audit | Security checks |
| `pnpm audit:circular` | Find circular dependencies | Code quality |

## Standard Package Scripts

All packages should implement these standard scripts:

### Required Scripts

#### `build`
Compile TypeScript to JavaScript.

```json
"build": "tsc"
```

**Apps:** May use bundlers (Vite, Webpack)
**Packages:** Usually TypeScript compiler only

#### `build:watch`
Build in watch mode for development.

```json
"build:watch": "tsc --watch"
```

#### `dev`
Development mode (usually same as `build:watch`).

```json
"dev": "tsc --watch"
```

**Apps:** May run dev servers
**Packages:** Usually watch mode compilation

#### `test`
Run test suite.

```json
// Jest
"test": "jest"

// Vitest
"test": "vitest run"
```

#### `test:unit`
Run unit tests only.

```json
"test:unit": "jest --testPathPattern=unit"
```

#### `test:watch`
Run tests in watch mode.

```json
"test:watch": "jest --watch"
```

#### `test:coverage`
Run tests with coverage reports.

```json
"test:coverage": "jest --coverage"
```

#### `lint`
Check code quality with ESLint.

```json
"lint": "eslint src/**/*.ts"
```

#### `lint:fix`
Auto-fix linting issues.

```json
"lint:fix": "eslint src/**/*.ts --fix"
```

#### `format`
Format code with Prettier.

```json
"format": "prettier --write \"src/**/*.ts\""
```

#### `format:check`
Check code formatting without changes.

```json
"format:check": "prettier --check \"src/**/*.ts\""
```

#### `type-check`
Type check without emitting files.

```json
"type-check": "tsc --noEmit"
```

#### `clean`
Remove build artifacts.

```json
"clean": "rimraf dist lib build coverage test-results"
```

### Optional Scripts

#### `test:integration`
Run integration tests.

```json
"test:integration": "jest --testPathPattern=integration"
```

#### `test:e2e`
Run end-to-end tests.

```json
"test:e2e": "playwright test"
```

#### `start`
Start the built application.

```json
"start": "node dist/main.js"
```

#### `start:prod`
Start in production mode.

```json
"start:prod": "NODE_ENV=production node dist/main.js"
```

## Script Naming Conventions

### Naming Pattern

```
<action>[:<target>][:<variant>]
```

Examples:
- `build` - Main build command
- `build:watch` - Build in watch mode
- `test:unit` - Run unit tests
- `test:e2e:debug` - Debug E2E tests
- `dev:memory-optimized` - Dev with memory optimizations

### Common Actions

- `build` - Compile/bundle code
- `dev` - Development mode
- `start` - Run built code
- `test` - Run tests
- `lint` - Check code quality
- `format` - Format code
- `clean` - Remove artifacts
- `type-check` - Validate types

### Common Targets

- `unit` - Unit tests
- `integration` - Integration tests
- `e2e` - End-to-end tests
- `api` - API-specific
- `frontend` - Frontend-specific
- `packages` - All packages
- `apps` - All apps

### Common Variants

- `watch` - Watch mode
- `coverage` - With coverage
- `debug` - Debug mode
- `prod` - Production mode
- `verbose` - Verbose output
- `fix` - Auto-fix issues
- `check` - Check only (no changes)

## Turbo Tasks

Turborepo tasks are defined in `turbo.json`. These tasks are cached and optimized for performance.

### Core Tasks

#### `build`
- **Depends on:** `^build` (dependencies must build first)
- **Inputs:** Source files, configs
- **Outputs:** Compiled files
- **Cache:** Enabled

#### `test`
- **Depends on:** `^build`
- **Inputs:** Source + test files
- **Outputs:** Coverage reports
- **Cache:** Enabled

#### `lint`
- **Depends on:** None
- **Inputs:** Source files, ESLint config
- **Outputs:** None
- **Cache:** Enabled

#### `format`
- **Depends on:** None
- **Inputs:** Source files, Prettier config
- **Outputs:** None
- **Cache:** Disabled (modifies files)

#### `format:check`
- **Depends on:** None
- **Inputs:** Source files, Prettier config
- **Outputs:** None
- **Cache:** Enabled

#### `dev`
- **Depends on:** `^build:types`, `^build`
- **Cache:** Disabled (long-running)
- **Persistent:** True

### Cache Optimization

Turbo automatically caches task outputs based on:
- Input file changes
- Environment variables
- Task configuration
- Dependency changes

**Clear cache:** `pnpm clean:cache`

## Pre/Post Hooks

npm automatically runs `pre*` and `post*` scripts before/after the main script.

### Active Hooks

#### `prepare`
Runs after `pnpm install`.

```json
"prepare": "husky"
```

Sets up Git hooks for linting and formatting.

#### `prebuild`
Runs before every build.

```json
"prebuild": "node scripts/pre-build-check.cjs"
```

Validates environment and dependencies.

#### `pretest`
Runs before tests.

```json
"pretest": "node scripts/pre-build-check.cjs"
```

Ensures environment is ready for testing.

### Creating Hooks

Add `pre<script>` or `post<script>` to run before/after any script:

```json
{
  "scripts": {
    "prebuild": "echo 'Building...'",
    "build": "tsc",
    "postbuild": "echo 'Build complete!'"
  }
}
```

**Note:** Hooks can slow down workflows. Use sparingly.

## Best Practices

### 1. Use Turbo for Parallel Execution

```bash
# Good: Leverages Turbo's parallelization
pnpm build

# Avoid: Sequential builds
cd packages/core && pnpm build
cd packages/utils && pnpm build
```

### 2. Leverage Caching

```bash
# Turbo caches unchanged builds
pnpm build  # First run: slow
pnpm build  # Second run: instant (if no changes)
```

### 3. Use Filters for Targeted Builds

```bash
# Build specific package
pnpm build --filter=@the-new-fuse/core

# Build all packages
pnpm build --filter=./packages/*

# Build with dependencies
pnpm build --filter=@the-new-fuse/frontend-app...
```

### 4. Run Tests Before Commits

```bash
# Quick pre-commit check
pnpm lint:staged && pnpm type-check

# Full validation
pnpm lint && pnpm type-check && pnpm test
```

### 5. Use Watch Mode During Development

```bash
# Single package
cd packages/core
pnpm dev

# Multiple packages with Turbo
pnpm dev
```

### 6. Clean Build Issues

```bash
# Remove build artifacts
pnpm clean

# Deep clean (removes node_modules)
pnpm clean:all

# Clear Turbo cache
pnpm clean:cache
```

### 7. Memory-Constrained Builds

```bash
# Optimize for low memory (Railway, cloud)
pnpm build:memory-optimized

# Ultra-low memory
pnpm build:low-memory
```

### 8. Consistent Script Names

Follow the naming convention across all packages:
- `build` not `compile`
- `test` not `tests`
- `lint:fix` not `lint-fix`
- `format:check` not `check-format`

### 9. Use package.json Scripts, Not CLI

```bash
# Good
pnpm test

# Avoid
npx jest
```

Scripts provide consistency and can include flags/environment variables.

### 10. Document Custom Scripts

Add comments in package.json for non-standard scripts:

```json
{
  "scripts": {
    "// Custom Scripts": "",
    "claude-dev": "ts-node src/scripts/claude-dev-cli.ts",
    "perf:monitor": "node scripts/performance-monitor.js"
  }
}
```

## Troubleshooting

### Port Conflicts

```bash
pnpm clear-ports
```

### Build Failures

```bash
# Clean and rebuild
pnpm clean && pnpm build

# Check for type errors
pnpm type-check

# Check for dependency issues
pnpm install
```

### Test Failures

```bash
# Run tests in watch mode to debug
pnpm test:watch

# Run specific test file
pnpm test path/to/test.spec.ts

# Check coverage
pnpm test:coverage
```

### Lint Errors

```bash
# Auto-fix where possible
pnpm lint:fix

# Format code
pnpm format

# Check remaining issues
pnpm lint
```

### Cache Issues

```bash
# Clear Turbo cache
pnpm clean:cache

# Clear all build artifacts
pnpm clean

# Deep clean
pnpm clean:all
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm build
```

### Railway Deployment

```bash
# Railway uses these scripts automatically
pnpm install
pnpm build:railway  # Or pnpm build:production
pnpm start
```

## Package-Specific Scripts

### Frontend (`apps/frontend`)

```bash
pnpm dev              # Vite dev server
pnpm build            # Production build
pnpm build:analyze    # Build with bundle analysis
pnpm preview          # Preview production build
pnpm test:ui          # Vitest UI mode
```

### Backend (`apps/backend`)

```bash
pnpm dev              # NestJS watch mode
pnpm start:dev        # NestJS dev mode
pnpm start:debug      # Debug mode
pnpm test:e2e         # End-to-end tests
```

### API Gateway (`apps/api-gateway`)

```bash
pnpm dev              # NestJS watch mode
pnpm start:prod       # Production mode
pnpm test             # Jest tests
```

### Core Package (`packages/core`)

```bash
pnpm build            # TypeScript compilation
pnpm dev              # Watch mode
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests
```

## Script Composition

### Chaining Scripts

```bash
# Sequential (stops on error)
pnpm lint && pnpm test && pnpm build

# Always run all (ignore errors)
pnpm lint; pnpm test; pnpm build
```

### Parallel Scripts

```json
{
  "scripts": {
    "check": "pnpm lint && pnpm type-check && pnpm test",
    "check:parallel": "concurrently \"pnpm:lint\" \"pnpm:type-check\" \"pnpm:test\""
  }
}
```

### Using Turborepo

```bash
# Turbo automatically parallelizes
pnpm test  # Runs tests in all packages concurrently

# Control concurrency
pnpm test --concurrency=4
```

## Environment Variables

### Build-Time Variables

```bash
# Set in scripts
BUILD_MEMORY_LIMIT=2048 pnpm build

# Or in .env files
NODE_ENV=production
BUILD_STRATEGY=memory-optimized
```

### Runtime Variables

```bash
# Set before start
PORT=3000 pnpm start

# Or use .env.local
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

## Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/)
- [npm Scripts Documentation](https://docs.npmjs.com/cli/v10/using-npm/scripts)
- [Project README](./README.md)

---

**Last Updated:** 2025-11-18
**Maintained By:** The New Fuse Team
