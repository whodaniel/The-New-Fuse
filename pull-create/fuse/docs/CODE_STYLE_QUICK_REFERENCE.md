# Code Style Quick Reference

Quick reference for common code style patterns in The New Fuse monorepo.

## File Naming

| Type | Convention | Example |
| --- | --- | --- |
| React Components | PascalCase | `UserProfile.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| Types/Interfaces | PascalCase | `UserData.ts` |
| Tests | `.test.ts` or `.spec.ts` | `UserProfile.test.tsx` |
| Hooks | `use` prefix | `useAuth.ts` |

## Import Order

```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises';

// 2. React (prioritized)
import { useState, useEffect } from 'react';

// 3. External packages
import axios from 'axios';

// 4. Internal packages (@the-new-fuse/*)
import { Button } from '@the-new-fuse/ui';

// 5. Relative imports (parent)
import { config } from '../../config';

// 6. Relative imports (sibling)
import { helper } from './helper';

// 7. Type imports
import type { User } from './types';
```

## TypeScript Patterns

### Prefer Type Inference

```typescript
// ✅ Good
const name = 'John';
const count = 42;

// ❌ Unnecessary
const name: string = 'John';
const count: number = 42;
```

### Use Type Imports

```typescript
// ✅ Good
import type { User } from './types';
import { api } from './api';

// ❌ Bad
import { User } from './types';
```

### Avoid `any`

```typescript
// ❌ Bad
function process(data: any) {}

// ✅ Good
function process<T>(data: T) {}
function process(data: unknown) {}
```

### Optional Chaining

```typescript
// ✅ Good
const name = user?.profile?.name ?? 'Anonymous';

// ❌ Bad
const name = user && user.profile && user.profile.name ? user.profile.name : 'Anonymous';
```

## React Patterns

### Component Props

```typescript
// ✅ Good - Interface with Props suffix
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

### Hooks

```typescript
// ✅ Good - At component top level
function Component() {
  const [state, setState] = useState(0);
  const data = useCustomHook();

  // ... rest of component
}

// ❌ Bad - Conditional hooks
function Component({ condition }) {
  if (condition) {
    const [state, setState] = useState(0); // ❌ Error!
  }
}
```

### Event Handlers

```typescript
// ✅ Good - handleX naming
function Component() {
  const handleClick = () => {
    // Handle click
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Handle submit
  };

  return <button onClick={handleClick}>Click</button>;
}
```

## Code Organization

### File Structure

```typescript
// 1. Imports
import { useState } from 'react';

import type { User } from './types';

// 2. Types/Interfaces
interface Props {
  user: User;
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Main export
export function Component({ user }: Props) {
  // Component body
}

// 5. Helper functions (if small)
function helper() {
  // Helper logic
}
```

### Exports

```typescript
// ✅ Good - Named exports
export function Button() {}
export const MAX_COUNT = 100;

// ✅ Good - Default export for components (when appropriate)
export default function Page() {}

// ❌ Avoid - Mixed default and named in same file
```

## Error Handling

```typescript
// ✅ Good
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof SpecificError) {
    logger.error('Specific error occurred', { error });
    handleSpecificError(error);
  } else {
    logger.error('Unexpected error', { error });
    throw error;
  }
}

// ❌ Bad
try {
  await riskyOperation();
} catch (error) {
  // Silent failure
}

// ❌ Bad
try {
  await riskyOperation();
} catch (error) {
  console.log(error); // Using console.log
}
```

## Async/Await

```typescript
// ✅ Good
async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// ✅ Good - Error handling
async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    return null;
  }
}

// ❌ Bad - Floating promise
function Component() {
  fetchUser('123'); // ❌ Not awaited or handled

  // ✅ Fix
  useEffect(() => {
    fetchUser('123').catch(handleError);
  }, []);
}
```

## Comments

```typescript
// ✅ Good - Explain WHY
// Use exponential backoff to avoid overwhelming the API
const delay = Math.pow(2, retryCount) * 1000;

// ✅ Good - Document business rules
// Per PCI compliance requirements, we must not store CVV
const sanitizedCard = { ...card, cvv: undefined };

// ❌ Bad - Explain WHAT (code should be self-documenting)
// Loop through users
users.forEach((user) => {});

// ❌ Bad - Outdated or wrong comments
// This will never fail (it can fail)
await riskyOperation();
```

## Common Commands

```bash
# Lint and auto-fix
pnpm run lint:fix

# Format code
pnpm run format:root

# Type check
pnpm run type-check

# Run all quality checks
pnpm run health-check

# Format entire codebase
./scripts/format-codebase.sh

# Pre-commit (runs automatically on commit)
pnpm run lint:staged
```

## ESLint Quick Fixes

```bash
# Fix all auto-fixable issues in a file
pnpm eslint path/to/file.ts --fix

# Fix all files in a directory
pnpm eslint apps/frontend --fix

# Check without fixing
pnpm eslint apps/frontend
```

## Prettier Quick Fixes

```bash
# Format a file
pnpm prettier --write path/to/file.ts

# Format a directory
pnpm prettier --write "apps/frontend/**/*.{ts,tsx}"

# Check without formatting
pnpm prettier --check "apps/frontend/**/*.{ts,tsx}"
```

## Ignoring Rules

### ESLint

```typescript
// Disable for next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;

// Disable for block
/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = response;
const other: any = otherResponse;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Disable for file (use sparingly)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Prettier

```typescript
// prettier-ignore
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];
```

### TypeScript

```typescript
// @ts-ignore - Use very sparingly
const value = someUntypedLibrary();

// @ts-expect-error - Better, will error if no longer needed
const value = someUntypedLibrary();
```

---

For detailed guidelines, see [CODE_QUALITY.md](./CODE_QUALITY.md)
