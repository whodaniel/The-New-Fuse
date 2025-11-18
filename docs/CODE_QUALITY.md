# Code Quality Guidelines

This document outlines the code quality standards, tooling, and best practices for The New
Fuse monorepo.

## Table of Contents

- [Overview](#overview)
- [Tooling Setup](#tooling-setup)
- [ESLint Configuration](#eslint-configuration)
- [Prettier Configuration](#prettier-configuration)
- [Git Hooks](#git-hooks)
- [VSCode Integration](#vscode-integration)
- [Code Style Guidelines](#code-style-guidelines)
- [Import Organization](#import-organization)
- [TypeScript Best Practices](#typescript-best-practices)
- [React Best Practices](#react-best-practices)
- [Running Quality Checks](#running-quality-checks)
- [Troubleshooting](#troubleshooting)

## Overview

Our code quality setup ensures consistent code style, catches bugs early, and improves code
maintainability through:

- **ESLint**: Linting for TypeScript, JavaScript, and React
- **Prettier**: Code formatting
- **lint-staged**: Pre-commit hooks for staged files
- **Husky**: Git hooks management
- **EditorConfig**: Editor-agnostic code style
- **TypeScript**: Type checking

## Tooling Setup

### Installation

All tools are already installed as dev dependencies. If you need to reinstall:

```bash
pnpm install
```

### VSCode Extensions

Install the recommended extensions:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- EditorConfig (`editorconfig.editorconfig`)
- Prisma (`prisma.prisma`)
- Jest (`orta.vscode-jest`)
- TypeScript (`ms-vscode.vscode-typescript-next`)

VSCode will prompt you to install these when you open the workspace.

## ESLint Configuration

### Root Configuration

The root `.eslintrc.json` provides base configuration for the entire monorepo:

- TypeScript support with `@typescript-eslint`
- React and React Hooks rules
- Import ordering and organization
- Accessibility checks with `jsx-a11y`
- Integration with Prettier

### Key Rules

#### TypeScript

- **Consistent type imports**: Use `import type` for type-only imports
- **No floating promises**: All promises must be awaited or handled
- **No explicit any**: Warns on `any` usage (not an error to allow gradual typing)
- **Unused variables**: Error with ignore pattern for variables starting with `_`

#### React

- **Hooks rules**: Enforced with `react-hooks/rules-of-hooks`
- **Exhaustive deps**: Warns on missing dependencies in hooks
- **No prop-types**: Disabled (using TypeScript instead)

#### Imports

- **Ordered imports**: Automatically organized by type and alphabetically
- **No duplicates**: Prevents duplicate imports
- **No cycles**: Warns on circular dependencies
- **Newline after import**: Enforces blank line after import block

#### General

- **No console**: Warns on console usage (except `console.warn` and `console.error`)
- **Prefer const**: Enforces `const` over `let` when possible
- **No var**: Errors on `var` usage
- **Equality**: Requires `===` and `!==` (except for null checks)
- **Curly braces**: Required for all control structures

### Package-Specific Overrides

Packages can extend the root config by creating their own `.eslintrc.json`:

```json
{
  "extends": ["../../.eslintrc.json"],
  "rules": {
    // Package-specific overrides
  }
}
```

## Prettier Configuration

### Configuration (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Key Settings

- **Single quotes**: For strings (except JSX attributes)
- **Semicolons**: Always required
- **Line width**: 100 characters (matches ESLint)
- **Trailing commas**: ES5 style (objects, arrays)
- **Tab width**: 2 spaces
- **Arrow parens**: Always include parentheses
- **Line endings**: LF (Unix-style)

### Ignored Files

See `.prettierignore` for the complete list. Key exclusions:

- `node_modules/`
- `dist/`, `build/`, `.next/`
- Generated files
- Lock files

## Git Hooks

### Pre-commit Hook

Automatically runs on `git commit`:

1. **lint-staged**: Runs on staged files only
2. **ESLint --fix**: Auto-fixes linting issues
3. **Prettier --write**: Formats code
4. **TypeScript check**: Validates types (no emit)

### Configuration (`.lintstagedrc.js`)

```javascript
module.exports = {
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write', () => 'tsc --noEmit --pretty'],
  '*.json': ['prettier --write'],
  '*.md': ['prettier --write'],
  '*.{yml,yaml}': ['prettier --write'],
};
```

### Skipping Hooks

Only in emergencies:

```bash
git commit --no-verify -m "Emergency fix"
```

**Note**: This should be used sparingly as it bypasses quality checks.

## VSCode Integration

### Auto-Format on Save

The workspace is configured to:

- Format on save
- Fix ESLint issues on save
- Organize imports on save
- Use Prettier as the default formatter

### Settings (`.vscode/settings.json`)

Key settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  }
}
```

## Code Style Guidelines

### Naming Conventions

#### Files and Directories

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types/Interfaces**: PascalCase (`UserData.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`

#### Variables and Functions

- **Variables**: camelCase (`userName`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Functions**: camelCase (`getUserData`, `handleClick`)
- **React Components**: PascalCase (`UserProfile`, `NavigationBar`)
- **Hooks**: `use` prefix (`useAuth`, `useLocalStorage`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)
- **Enums**: PascalCase with UPPER_SNAKE_CASE values

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
```

#### Private Members

- Use `_` prefix for private members or variables to ignore

```typescript
function example(_unusedParam: string) {
  const _privateVar = 'internal';
}
```

### Code Organization

#### File Structure

```typescript
// 1. Imports (automatically organized)
import { useState } from 'react';

import type { User } from './types';

// 2. Types/Interfaces
interface Props {
  user: User;
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Component/Function
export function UserProfile({ user }: Props) {
  // Implementation
}

// 5. Helpers (if small, otherwise separate file)
function formatUserName(name: string) {
  // Implementation
}
```

#### Module Boundaries

- Keep related code together
- Use index files for clean public APIs
- Avoid circular dependencies

### Comments

#### When to Comment

- **Complex logic**: Explain the "why", not the "what"
- **Business rules**: Document domain-specific requirements
- **Workarounds**: Explain temporary solutions
- **TODOs**: Use `// TODO:` with description

#### When NOT to Comment

- **Obvious code**: Code should be self-documenting
- **Commented-out code**: Delete it (use git history)
- **Outdated comments**: Remove or update them

```typescript
// ❌ Bad
// Set user name to John
const userName = 'John';

// ✅ Good
// Default to guest user when authentication fails
const userName = authUser?.name ?? 'Guest';
```

### Error Handling

```typescript
// ✅ Good - Specific error handling
try {
  await fetchUserData(userId);
} catch (error) {
  if (error instanceof NetworkError) {
    logger.error('Network error fetching user', { userId, error });
    showNetworkErrorToast();
  } else {
    logger.error('Unexpected error fetching user', { userId, error });
    throw error;
  }
}

// ❌ Bad - Silent failures
try {
  await fetchUserData(userId);
} catch (error) {
  // Empty catch
}
```

## Import Organization

Imports are automatically organized by ESLint into groups:

1. **Built-in modules**: Node.js core modules
2. **External modules**: npm packages
3. **React**: Separated at the top of externals
4. **Internal modules**: `@the-new-fuse/*` packages
5. **Parent directories**: `../`
6. **Sibling files**: `./`
7. **Type imports**: `import type`

Example:

```typescript
import { readFile } from 'fs/promises';

import { useState, useEffect } from 'react';

import axios from 'axios';
import { format } from 'date-fns';

import { api } from '@the-new-fuse/api-client';
import { Button } from '@the-new-fuse/ui';

import { config } from '../../config';

import { formatUserName } from './utils';

import type { User } from './types';
```

## TypeScript Best Practices

### Type Annotations

```typescript
// ✅ Good - Let TypeScript infer
const userName = 'John'; // inferred as string
const count = 42; // inferred as number
const user = { name: 'John', age: 30 }; // inferred as object

// ✅ Good - Explicit when needed
function getUser(id: string): Promise<User> {
  return api.getUser(id);
}

// ❌ Bad - Unnecessary annotations
const userName: string = 'John';
```

### Type Imports

```typescript
// ✅ Good - Type-only imports
import type { User, Post } from './types';
import { api } from './api';

// ❌ Bad - Mixed imports
import { User, Post, api } from './types';
```

### Avoid `any`

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good - Use generics
function processData<T extends { value: unknown }>(data: T) {
  return data.value;
}

// ✅ Good - Use unknown for truly unknown types
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}
```

### Null Safety

```typescript
// ✅ Good - Optional chaining and nullish coalescing
const userName = user?.profile?.name ?? 'Anonymous';

// ✅ Good - Explicit null checks
if (user !== null && user !== undefined) {
  console.log(user.name);
}

// ❌ Avoid - Non-null assertion (use sparingly)
const userName = user!.name;
```

## React Best Practices

### Component Structure

```typescript
import { useState, useEffect } from 'react';

import type { User } from './types';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Effect logic
  }, [userId]);

  if (loading) {
    return <Loading />;
  }

  return <div>{/* Component JSX */}</div>;
}
```

### Hooks Rules

```typescript
// ✅ Good - Hooks at top level
function Component() {
  const [state, setState] = useState(0);
  const value = useCustomHook();

  return <div />;
}

// ❌ Bad - Conditional hooks
function Component({ condition }) {
  if (condition) {
    const [state, setState] = useState(0); // ❌ Error!
  }
  return <div />;
}
```

### Props Destructuring

```typescript
// ✅ Good - Destructure in parameters
function Button({ label, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

// ❌ Avoid - Accessing props object
function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

## Running Quality Checks

### Commands

```bash
# Lint all code
pnpm run lint

# Lint and auto-fix
pnpm run lint:fix

# Format all code
pnpm run format:root

# Check formatting without changes
pnpm run format:check:root

# Type check
pnpm run type-check

# Run all checks (lint + type-check + tests)
pnpm run health-check

# Format entire codebase (comprehensive)
./scripts/format-codebase.sh
```

### Package-Level Commands

Run commands in specific packages:

```bash
# In any package directory
pnpm run lint
pnpm run lint:fix
pnpm run format
pnpm run type-check
```

### Turbo Commands

Run across all packages:

```bash
# Run lint in all packages
pnpm turbo run lint

# Run lint in parallel
pnpm turbo run lint --concurrency=10
```

## Troubleshooting

### ESLint Issues

#### "Unable to resolve path to module"

**Cause**: ESLint can't find imported modules

**Solution**:

1. Ensure the module exists
2. Check `tsconfig.json` paths configuration
3. Verify `import/resolver` settings in `.eslintrc.json`

#### "Parsing error: Cannot read file"

**Cause**: ESLint can't parse a file

**Solution**:

1. Check file syntax
2. Ensure correct parser in `.eslintrc.json`
3. Check `parserOptions.project` includes the file's tsconfig

### Prettier Issues

#### "No parser could be inferred"

**Cause**: Prettier doesn't know how to format the file

**Solution**:

1. Check file extension is supported
2. Add explicit parser in `.prettierrc` overrides
3. Add file to `.prettierignore` if it shouldn't be formatted

### Git Hook Issues

#### "lint-staged not found"

**Cause**: Husky can't find lint-staged

**Solution**:

```bash
pnpm install
```

#### "Hooks not running"

**Cause**: Git hooks not installed

**Solution**:

```bash
pnpm husky install
```

### Performance Issues

#### ESLint/Prettier running slow

**Solutions**:

1. Check `.eslintignore` and `.prettierignore`
2. Use `--max-warnings` flag for ESLint
3. Run on specific directories instead of entire codebase
4. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096`

### VSCode Not Auto-Formatting

**Checklist**:

1. ✓ Prettier extension installed
2. ✓ ESLint extension installed
3. ✓ Workspace settings include format on save
4. ✓ File is not in `.prettierignore`
5. ✓ Prettier config exists (`.prettierrc`)
6. Restart VSCode

## Additional Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)

---

**Last Updated**: 2025-11-18
**Maintained By**: The New Fuse Team
