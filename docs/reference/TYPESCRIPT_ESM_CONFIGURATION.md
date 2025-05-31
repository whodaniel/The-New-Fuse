# TypeScript ESM Configuration Guide

## Overview

This document provides guidance on configuring TypeScript projects to work properly with ECMAScript Modules (ESM). This is particularly relevant for projects that use `"type": "module"` in their package.json, indicating they use native ES modules instead of CommonJS.

## Common Issues

When working with TypeScript and ES modules, you may encounter these common issues:

1. **Unknown File Extension Error**: `ERR_UNKNOWN_FILE_EXTENSION: Unknown file extension ".ts"`
2. **Module Resolution Errors**: Path aliases like `@/*` don't work with native ESM
3. **ESM/CommonJS Compatibility**: `exports is not defined in ES module scope` or similar errors
4. **Missing File Extensions**: ESM requires explicit file extensions in imports

## Configuration Guide

### 1. Package.json Configuration

Ensure your package.json is correctly set up for ES modules:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon",
    "start": "node --experimental-specifier-resolution=node dist/index.js"
  }
}
```

### 2. TypeScript Configuration (tsconfig.json)

Update your TypeScript configuration to support ES modules:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2020",
    "outDir": "./dist",
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### 3. TS-Node Configuration (tsconfig.node.json)

Create a special configuration file for ts-node:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "ts-node": {
    "esm": true
  }
}
```

### 4. Nodemon Configuration (nodemon.json)

Configure nodemon to use ts-node with proper ESM support:

```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "node --import ts-node/register/esm src/index.ts"
}
```

## Best Practices

### Import Statements

In TypeScript ESM projects, you need to:

1. **Add `.js` extensions** to all local imports, even though you're importing `.ts` files:
   ```typescript
   // Correct for ESM
   import { MyClass } from './my-class.js';
   
   // Won't work in ESM
   import { MyClass } from './my-class';
   ```

2. **Use relative imports** instead of path aliases when possible:
   ```typescript
   // Better for ESM compatibility
   import { MyClass } from '../components/my-class.js';
   
   // May need special handling
   import { MyClass } from '@/components/my-class';
   ```

3. **For path aliases**, you need to use a module resolution plugin or loader

### Module Conversion

When converting from CommonJS to ESM:

1. Replace CommonJS syntax with ESM equivalents:

   | CommonJS | ESM |
   |----------|-----|
   | `const { x } = require('y')` | `import { x } from 'y'` |
   | `exports.x = y` | `export const x = y` |
   | `module.exports = x` | `export default x` |

2. Remove CommonJS compatibility code:
   ```typescript
   // Remove this
   Object.defineProperty(exports, "__esModule", { value: true });
   ```

## Troubleshooting

### Path Alias Resolution

To make path aliases work with ESM:

1. Use the `--experimental-specifier-resolution=node` flag with Node.js
2. Use a custom loader like `ts-paths` or `tsconfig-paths`
3. Convert path aliases to relative imports in built JavaScript

### Missing Modules

If you encounter `Cannot find module` errors:

1. Check that the module exists
2. Ensure imports include the `.js` extension
3. Verify your `tsconfig.node.json` is configured correctly

### CommonJS Compatibility

For libraries that only work with CommonJS:

1. Create a separate ESM wrapper around the CommonJS module
2. Use dynamic imports for CommonJS modules
3. Use the `--import ts-node/register/esm` flag instead of experimental flags

### Avoiding Experimental Warnings

If you see experimental warnings in your console:

1. **Replace `--loader ts-node/esm` with `--import ts-node/register/esm`**
   ```json
   "exec": "node --import ts-node/register/esm src/index.ts"
   ```

2. **Remove `experimentalSpecifierResolution` from your ts-node configuration**
   ```json
   "ts-node": {
     "esm": true
   }
   ```

3. **Use `tsconfig-paths` package** for path alias resolution instead of experimental flags

## Example Project Structure

```
my-project/
├── package.json            # "type": "module"
├── tsconfig.json           # module: "NodeNext"
├── tsconfig.node.json      # ts-node ESM config
├── nodemon.json            # node --loader ts-node/esm
└── src/
    ├── index.ts            # imports with .js extensions
    └── components/
        └── my-class.ts     # export declarations
```

## Additional Resources

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [ts-node ESM Guide](https://typestrong.org/ts-node/docs/imports/)

## Implementation Notes - May 16, 2025

The New Fuse project successfully implemented the ESM configuration. Here's what we learned:

1. **Experimental Warnings**: Running with `--experimental-specifier-resolution=node` shows warnings that can be safely ignored:
   ```
   ExperimentalWarning: The Node.js specifier resolution flag is experimental. It could change or be removed at any time.
   ```

2. **Multiple Apps Coordination**: When working with multiple interconnected apps (API and backend), all apps must use consistent ESM configuration. We standardized:
   - All apps use the same nodemon.json configuration
   - All apps use compatible tsconfig.node.json settings
   - Path aliases were handled consistently across apps

3. **Fix Order Matters**: Our fix implementation followed this order:
   - First create proper directory structures
   - Then update TS configurations
   - Then update nodemon configuration
   - Then fix import statements
   - Lastly, update package.json scripts

4. **Verification**: A successful implementation shows servers starting on their respective ports with no module resolution errors.

See `docs/DEVELOPMENT-LOG.md` for a detailed account of the specific fixes applied to The New Fuse project.

---

*Last updated: May 16, 2025 (Modern ESM configuration)*
