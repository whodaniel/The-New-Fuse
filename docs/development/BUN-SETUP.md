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
pnpm --version
```

## Project Setup

### Install Dependencies

```bash
pnpm install
```

### Run Setup Script

```bash
pnpm run scripts/setup-pnpm.js
```

## Development Workflow

### Install Dependencies

```bash
pnpm install
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

1. **Lock file conflicts**: Delete `pnpm-lock.yaml` and run `pnpm install`
2. **Build failures**: Run `pnpm run clean` then `pnpm run build`
3. **Dependency issues**: Run `pnpm install --force`

### Package-specific Commands

```bash
# Install in specific package
pnpm install --cwd packages/core
```

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
