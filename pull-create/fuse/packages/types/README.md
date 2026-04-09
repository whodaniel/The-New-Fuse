# @fuse/types

This package contains all TypeScript type definitions used throughout the Fuse monorepo.

## Structure

The package is organized into domain-specific modules:

- `core`: Contains base types, enums, and utilities used across all modules
- `task`: Task-related types, DTOs, and service interfaces
- (Additional modules will be added as needed)

## Usage

### Importing Types

For best tree-shaking, import from specific modules:

```typescript
// Preferred approach - specific imports
import { TaskStatus, TaskType } from '@fuse/types/core';
import { Task, TaskService } from '@fuse/types/task';

// Alternative - import everything (not recommended for production)
import * as FuseTypes from '@fuse/types';
```

### Adding New Types

1. Determine the appropriate domain for your new types
2. Place them in the existing domain directory or create a new one
3. Export the types from the domain's index.ts file
4. If needed, add the domain export to the root index.ts

## Guidelines

- Avoid circular dependencies between modules
- Keep enums and constant values in the core module
- Use descriptive names and follow TypeScript best practices
- Document complex types with JSDoc comments
- Use namespaces to avoid naming collisions when needed# @fuse/types

This package contains all TypeScript type definitions used throughout the Fuse monorepo.

## Structure

The package is organized into domain-specific modules:

- `core`: Contains base types, enums, and utilities used across all modules
- `task`: Task-related types, DTOs, and service interfaces
- (Additional modules will be added as needed)

## Usage

### Importing Types

For best tree-shaking, import from specific modules:

```typescript
// Preferred approach - specific imports
import { TaskStatus, TaskType } from '@fuse/types/core';
import { Task, TaskService } from '@fuse/types/task';

// Alternative - import everything (not recommended for production)
import * as FuseTypes from '@fuse/types';
```

### Adding New Types

1. Determine the appropriate domain for your new types
2. Place them in the existing domain directory or create a new one
3. Export the types from the domain's index.ts file
4. If needed, add the domain export to the root index.ts

## Guidelines

- Avoid circular dependencies between modules
- Keep enums and constant values in the core module
- Use descriptive names and follow TypeScript best practices
- Document complex types with JSDoc comments
- Use namespaces to avoid naming collisions when needed