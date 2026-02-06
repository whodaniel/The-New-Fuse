# PNPM Setup Guide

This guide covers setting up PNPM for The New Fuse development environment.

## Prerequisites

- Node.js 18+ installed
- PNPM package manager

## Installation

### Install PNPM

```bash
npm install -g pnpm
```

### Verify Installation

```bash
# Install all dependencies
pnpm install

# Run the setup script
pnpm run scripts/setup-bun.js
```

## Project Setup

### Install Dependencies

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run development server
pnpm run dev

# Run tests
pnpm test

# Run a specific workspace
pnpm run --filter @the-new-fuse/core build
```

### Run Setup Script

```bash
# Add a regular dependency
pnpm add react

# Add a dev dependency
pnpm add -d typescript

# Add to a specific workspace
pnpm add express --cwd packages/core
```

## Development Workflow

### Install Dependencies

```bash
# Run a script in a specific workspace
pnpm run --filter @the-new-fuse/core build

# Install dependencies for a specific workspace
pnpm install --cwd packages/core

# Add a dependency to a specific workspace
pnpm add express --cwd packages/api
```

### Build Project

```bash
pnpm run build
```

### Start Development

```bash
pnpm run dev
```

## Workspace Commands

### Build Specific Package

```bash
pnpm run --filter @the-new-fuse/core build
```

## Troubleshooting

### Common Issues

1. Check Bun version: `bun --version`
2. Clear cache: `bun pm cache clear`
3. Reinstall dependencies: `rm -rf node_modules && pnpm install`
4. Check for conflicting package managers (remove yarn.lock if present)

### Package-specific Commands

If migrating from Yarn:

1. Remove yarn.lock and .yarn directory
2. Remove .yarnrc.yml file
3. Run `pnpm install` to create bun.lockb
4. Update scripts to use `bun` instead of `yarn`

## Best Practices

1. Always use `pnpm install --frozen-lockfile` in CI
2. Use workspace commands for monorepo operations
3. Keep dependencies up to date with `pnpm update`

## Migration Notes

If migrating from Bun:

1. Remove `bun.lockb` file
2. Remove any Bun-specific configurations
3. Reinstall dependencies: `rm -rf node_modules && pnpm install`
4. Update scripts to use `pnpm` instead of `bun`
5. Verify builds work correctly

## Verification

After setup, verify everything works:

1. Check installation: `pnpm --version`
2. Install dependencies: `pnpm install`
3. Run `pnpm install` to create pnpm-lock.yaml
