# TypeScript ESM Quick Reference (Updated)

## Modern ESM Configuration (May 2025)

### Starting the Application

```bash
# Normal development start
yarn dev

# API server only
cd apps/api && yarn dev

# Backend only
cd apps/backend && yarn dev
```

### What Changed?

1. **Node.js Flags Updated**:
   - Replaced `--loader ts-node/esm` with `--import ts-node/register/esm`
   - Removed experimental flag `--experimental-specifier-resolution=node`

2. **Import Approaches**:
   - Still requires `.js` extension for local imports
   - Path mapping resolution now handled through tsconfig-paths

3. **Benefits**:
   - No more experimental warnings
   - Cleaner startup process
   - More aligned with Node.js stable features

### Import Style Guide (Same as Before)

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

### Troubleshooting

If you encounter module resolution issues:

1. **Common Error**: `Cannot find module '...' imported from '...'`
   - Make sure all local imports have `.js` extensions
   - Check that the file exists at the specified path

2. **Path Alias Issues**:
   - Path aliases like `@/*` are resolved through tsconfig-paths
   - Try using relative paths if path aliases aren't working

3. **Node.js Version**:
   - This configuration works best with Node.js 18.x+
   - If using a different version, you may need additional flags

### Documentation

For more details, see:
- [TypeScript ESM Configuration Guide](/docs/TYPESCRIPT_ESM_CONFIGURATION.md)
- [Development Log](/docs/DEVELOPMENT-LOG.md)
