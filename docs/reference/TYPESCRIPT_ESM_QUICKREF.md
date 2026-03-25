# TypeScript ESM Quick Reference Guide

## Quick Fix Commands

If you encounter TypeScript ESM issues in The New Fuse project, use these commands:

```bash
# Fix TypeScript ESM issues
cd "."
chmod +x fix-typescript-esm-all.sh
./fix-typescript-esm-all.sh

# Start the development environment
yarn dev
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| ERR_UNKNOWN_FILE_EXTENSION | Use `--loader ts-node/esm` flag |
| Cannot find module | Add `.js` extensions to imports |
| exports is not defined | Convert CommonJS syntax to ESM |
| Path alias doesn't work | Use `--experimental-specifier-resolution=node` |

## Required Configuration Files

### 1. nodemon.json
```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --loader ts-node/esm --experimental-specifier-resolution=node src/index.ts"
}
```

### 2. tsconfig.node.json
```json
{
  "extends": "./tsconfig.json",
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

### 3. package.json script
```json
"scripts": {
  "dev": "cross-env PORT=3003 nodemon"
}
```

### 4. TypeScript import format
```typescript
// Correct ESM import (note the .js extension)
import { MyClass } from './my-class.js';

// Export format
export const myFunction = () => {};
export default MyClass;
```

## Node.js Command Reference

```bash
# Run TypeScript with ESM
node --loader ts-node/esm --experimental-specifier-resolution=node src/index.ts

# Run built JavaScript with ESM
node --experimental-specifier-resolution=node dist/index.js
```

For detailed information, see [TYPESCRIPT_ESM_CONFIGURATION.md](./TYPESCRIPT_ESM_CONFIGURATION.md).
