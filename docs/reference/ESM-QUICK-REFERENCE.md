# TypeScript ESM Quick Reference

## Command Guide for The New Fuse (May 2025)

### Starting the Application

```bash
# Normal development start
yarn dev

# API server only
cd apps/api && yarn dev

# Backend only
cd apps/backend && yarn dev
```

### Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Unknown file extension `.ts` | Check nodemon.json has `--loader ts-node/esm` |
| Cannot find module | Add `.js` extension to imports or use relative paths |
| exports is not defined | Replace CommonJS syntax with ESM syntax |

### Import Style Guide

✅ **DO**:
```typescript
// Local imports need .js extension (even for .ts files)
import { MyClass } from './my-class.js';

// For node_modules (no extension needed)
import { useState } from 'react';

// For index files
import { utils } from './utils/index.js';
// OR (shorter)
import { utils } from './utils/js';
```

❌ **DON'T**:
```typescript
// Missing extension (won't work in ESM)
import { MyClass } from './my-class';

// Wrong extension (use .js not .ts)
import { MyClass } from './my-class.ts';
```

### Adding New Files

When creating new TypeScript files in the project:

1. Use ESM syntax for imports/exports
2. Add `.js` extensions to all local imports
3. Update nodemon if needed for new directories
4. Update the fix script if major structure changes are made

### Fix Script Usage

If you encounter module resolution issues, run:

```bash
# From project root
./fix-typescript-esm-all.sh
```

This script:
- Updates nodemon configuration
- Creates necessary TypeScript configs
- Fixes import statements
- Creates missing directories
- Makes backups of modified files (.bak extension)

### Documentation

For more details, see:
- [TypeScript ESM Configuration Guide](/docs/TYPESCRIPT_ESM_CONFIGURATION.md)
- [Development Log](/docs/DEVELOPMENT-LOG.md)
