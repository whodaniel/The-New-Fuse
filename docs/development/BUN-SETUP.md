# Bun Setup Documentation

## Overview

This project uses Bun for dependency management and as a JavaScript runtime. Bun is a fast all-in-one JavaScript runtime that includes a package manager, bundler, and test runner.

## Installation

Install Bun from the official website:

```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Or via npm
npm install -g bun
```

## Key Features

Bun provides built-in support for:
- Fast package installation (faster than npm/yarn)
- TypeScript compilation (no additional setup required)
- Workspace management for monorepos
- Built-in bundler
- Test runner
- Hot reloading

## Getting Started

If you're new to the project:

```bash
# Install all dependencies
pnpm install

# Run the setup script
pnpm run scripts/setup-bun.js
```

## Daily Usage

### Running Bun Commands

Bun commands are straightforward:

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

### Adding Dependencies

Adding dependencies is simple with Bun:

```bash
# Add a regular dependency
pnpm add react

# Add a dev dependency
pnpm add -d typescript

# Add to a specific workspace
pnpm add express --cwd packages/core
```

## Working with Monorepo Workspaces

This project uses Bun workspaces for monorepo management. To work with specific workspaces:

```bash
# Run a script in a specific workspace
pnpm run --filter @the-new-fuse/core build

# Install dependencies for a specific workspace
pnpm install --cwd packages/core

# Add a dependency to a specific workspace
pnpm add express --cwd packages/api
```

## Environment Variables

Bun automatically loads environment variables from `.env` files. No additional configuration needed.

## TypeScript Support

Bun has built-in TypeScript support:
- No need for ts-node
- No need for separate TypeScript compilation
- Runs TypeScript files directly
- Fast compilation

## Performance Benefits

Bun is significantly faster than npm/yarn:
- Package installation is 2-3x faster
- Script execution is faster due to built-in runtime
- Built-in bundling eliminates need for webpack/rollup

## Troubleshooting

If you encounter Bun-related issues:

1. Check Bun version: `bun --version`
2. Clear cache: `bun pm cache clear`
3. Reinstall dependencies: `rm -rf node_modules && pnpm install`
4. Check for conflicting package managers (remove yarn.lock if present)

## Migration from Yarn

If migrating from Yarn:
1. Remove yarn.lock and .yarn directory
2. Remove .yarnrc.yml file
3. Run `pnpm install` to create bun.lockb
4. Update scripts to use `bun` instead of `yarn`

## Why Bun?

- **Speed**: Much faster than npm/yarn for installation and execution
- **Simplicity**: All-in-one tool eliminates need for multiple tools
- **Modern**: Built with modern JavaScript features in mind
- **TypeScript**: Native TypeScript support without configuration
- **Compatibility**: Drop-in replacement for npm/yarn in most cases
