# Development Guide

## Getting Started

### Prerequisites

- **Bun** 1.2.15+ (recommended)
- **Node.js** 18+ (fallback)
- **Git** 2.30+
- **VS Code** (recommended)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd "The New Fuse"

# Install dependencies
bun install

# Run type checking
bun run type-check

# Run tests
bun test

# Start development server
bun run dev
```

## Architecture Overview

### Monorepo Structure

```
The New Fuse/
├── apps/                    # Applications
│   ├── api/                # Backend API
│   ├── frontend/           # React frontend
│   └── desktop/            # Desktop application
├── packages/               # Shared packages
│   ├── types/              # TypeScript types
│   ├── core/               # Core business logic
│   ├── shared/             # Shared utilities
│   ├── ui-consolidated/    # UI components
│   └── test-utils/         # Testing utilities
├── scripts/                # Build and utility scripts
└── tools/                  # Development tools
```

### Package Dependencies

```
@the-new-fuse/types (foundation)
├── @the-new-fuse/core (depends on types)
├── @the-new-fuse/shared (depends on types)
├── @the-new-fuse/ui-consolidated (depends on types, shared)
└── @the-new-fuse/test-utils (depends on types)
```

### TypeScript Configuration

The project uses a unified TypeScript configuration:
- **Base Config**: `tsconfig.base.json` - shared compiler options
- **Package Configs**: Each package extends the base configuration
- **Path Mappings**: Centralized import path resolution

## Development Workflow

### 1. Setting Up Your Environment

```bash
# Install VS Code extensions (recommended)
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next

# Set up Git hooks
bun run prepare
```

### 2. Making Changes

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Run quality gates
./scripts/quality-gate.sh

# Commit your changes
git add .
git commit -m "feat: your feature description"
```

### 3. Testing

```bash
# Run all tests
bun test

# Run specific test types
bun run test:unit
bun run test:integration
bun run test:e2e

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun test --watch
```

### 4. Building

```bash
# Build all packages
bun run build

# Build specific packages
bun run build --filter=@the-new-fuse/types

# Build for production
bun run build:prod
```

## Contributing Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with recommended rules
- **Prettier**: Automatic code formatting
- **Naming**: Use descriptive, camelCase names

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality gates
5. Create a pull request
6. Address review feedback
7. Merge when approved

### Testing Guidelines

- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Coverage**: Maintain 80%+ test coverage

### Package Development

#### Creating a New Package

```bash
# Create package structure
mkdir -p packages/your-package/src
cd packages/your-package

# Create package.json
cat > package.json << EOF
{
  "name": "@the-new-fuse/your-package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "bun test"
  }
}
EOF

# Create TypeScript config
cat > tsconfig.json << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF
```

#### Package Guidelines

- Use `@the-new-fuse/` prefix for all packages
- Follow semantic versioning
- Include comprehensive README
- Add appropriate TypeScript types
- Write tests for all public APIs

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
bun run clean
bun install
bun run build
```

#### Test Failures

```bash
# Check Jest/Bun compatibility
cat jest.setup.cjs

# Verify test environment
bun test test/index.test.ts
```

#### TypeScript Errors

```bash
# Check type definitions
bun run type-check

# Verify path mappings
cat tsconfig.base.json
```

### Getting Help

- **Documentation**: Check package READMEs
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Code Review**: Request reviews for complex changes

## Performance Optimization

### Build Performance

- Use `--filter` for targeted builds
- Enable TypeScript incremental compilation
- Use Bun for faster package management

### Runtime Performance

- Implement lazy loading where appropriate
- Use React.memo for expensive components
- Optimize bundle sizes with tree shaking

### Development Performance

- Use TypeScript project references
- Enable hot module replacement
- Use fast refresh for React development
