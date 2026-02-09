# TypeScript Configuration Guide

This document provides a comprehensive overview of the TypeScript configuration in The New Fuse project, explaining the structure, inheritance patterns, and best practices for TypeScript development.

## Configuration Files Overview

The project uses a hierarchical TypeScript configuration system with several specialized configuration files for different purposes:

| File | Purpose |
|------|--------|
| `tsconfig.base.json` | Base configuration that defines common settings for all TypeScript files |
| `tsconfig.json` | Main configuration that extends the base and adds project-specific settings |
| `tsconfig.build.json` | Production build configuration optimized for compilation |
| `tsconfig.prod.json` | Enhanced production configuration with optimizations |
| `tsconfig.types.json` | Configuration for generating TypeScript declaration files |
| `tsconfig-check.json` | Configuration for strict type checking |

## Configuration Inheritance Pattern

The project follows a hierarchical inheritance pattern:

```
tsconfig.base.json
    ↑
tsconfig.json
    ↑
┌────┴────┐
│         │
tsconfig.build.json  tsconfig.prod.json
```

Package-specific configurations in `apps/` and `packages/` directories extend from `tsconfig.base.json`.

## Base Configuration (tsconfig.base.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@the-new-fuse/*": ["packages/*/src"],
      "@app/*": ["apps/*/src"]
    },
    "types": ["jest", "node"]
  },
  "exclude": ["node_modules", "dist"],
  "references": [
    { "path": "packages/core" },
    { "path": "packages/types" },
    { "path": "apps/api" },
    { "path": "apps/client" }
  ]
}
```

The base configuration establishes:
- ES2022 as the target JavaScript version
- Node.js module resolution
- Strict type checking
- Path aliases for the monorepo structure
- Project references for TypeScript's project mode

## Main Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "strictBindCallApply": true,
    "esModuleInterop": true,
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "lib": ["ES2020", "DOM"],
    "types": ["node"],
    "paths": {
      "@the-new-fuse/*": ["packages/*/src"],
      "@config/*": ["config/*"]
    },
    "jsx": "react-jsx"
  },
  "ts-node": {
    "esm": true,
    "experimentalSpecifiers": true
  },
  "include": ["packages/**/*", "apps/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

The main configuration adds:
- React JSX support
- Declaration file generation
- Source map generation
- Additional path aliases
- ts-node configuration for running TypeScript directly

## Build Configuration (tsconfig.build.json)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "skipLibCheck": true
  },
  "exclude": [
    "node_modules",
    "**/*.spec.ts",
    "**/*.test.ts",
    "dist"
  ]
}
```

The build configuration:
- Enables JavaScript emission (sets `noEmit` to false)
- Excludes test files from the build

## Production Configuration (tsconfig.prod.json)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "removeComments": true,
    "noEmitOnError": true,
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",
    "outDir": "./dist/prod",
    "declaration": true,
    "declarationMap": false
  },
  "include": [
    "src/**/*",
    "packages/**/*",
    "apps/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

The production configuration adds:
- Comment removal for smaller output
- Incremental compilation for faster builds
- Separate output directory for production builds
- No source maps for security and size optimization

## Types Configuration (tsconfig.types.json)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist/types",
    "baseUrl": ".",
    "paths": {
      "*": ["src/*", "node_modules/*"]
    },
    "jsx": "react-jsx",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "target": "es2020",
    "lib": ["es6", "dom"],
    "resolveJsonModule": true
  },
  "include": ["packages/*/src"],
  "exclude": ["node_modules", "dist", "build"]
}
```

The types configuration:
- Only emits declaration files (no JavaScript)
- Targets the packages source directories
- Enables JSON module resolution

## Package-Specific Configurations

Each package in the monorepo has its own TypeScript configuration that extends the base configuration:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2020",
    "outDir": "out",
    "rootDir": ".",
    "sourceMap": true,
    "esModuleInterop": true,
    "strict": true,
    "moduleResolution": "node",
    "declaration": true,
    "types": [
      "vscode",
      "node"
    ]
  },
  "exclude": [
    "node_modules",
    "out",
    "test"
  ]
}
```

Package-specific configurations can override settings from the base configuration to meet the specific needs of that package.

## TypeScript Compiler Options Explained

### Core Options

- `target`: Specifies the ECMAScript target version
- `module`: Specifies the module code generation method
- `moduleResolution`: Determines how modules are resolved
- `lib`: Specifies library files to include in the compilation

### Type Checking Options

- `strict`: Enables all strict type checking options
- `strictNullChecks`: Makes null and undefined have their own distinct types
- `strictBindCallApply`: Enables stricter checking of the bind, call, and apply methods

### Emit Options

- `declaration`: Generates corresponding .d.ts files
- `sourceMap`: Generates source map files for debugging
- `outDir`: Specifies the output directory for compiled files
- `noEmit`: Disables emitting files from a compilation

### Module Resolution Options

- `baseUrl`: Base directory to resolve non-relative module names
- `paths`: List of path mappings for module names to locations
- `types`: Type declaration files to include in compilation

## Best Practices

1. **Use the Inheritance Pattern**: Extend from base configurations rather than duplicating settings

2. **Maintain Strict Type Checking**: Keep `strict: true` in all configurations to ensure type safety

3. **Use Path Aliases**: Leverage the `paths` configuration for clean imports across the monorepo

4. **Separate Build Configurations**: Use different configurations for development, testing, and production

5. **Incremental Compilation**: Enable `incremental: true` for faster subsequent builds

6. **Project References**: Use TypeScript's project references for better build performance in a monorepo

7. **Consistent Module Resolution**: Stick to one module resolution strategy throughout the project

## Troubleshooting Common Issues

### Module Not Found Errors

If you encounter module not found errors, check:
- Path aliases in tsconfig.json
- Module resolution strategy
- File extensions in import statements

### Type Errors in Third-Party Libraries

If you encounter type errors in third-party libraries:
- Use `skipLibCheck: true` to ignore errors in declaration files
- Install @types packages for libraries without built-in types
- Create custom type declarations in a .d.ts file

### Performance Issues

If TypeScript compilation is slow:
- Enable incremental compilation
- Use project references
- Exclude test files from the main build
- Consider using `esbuild` or other faster transpilers for development

## Conclusion

The TypeScript configuration in The New Fuse project is designed to provide a balance between strict type safety and development flexibility. By understanding the inheritance patterns and specialized configurations, developers can ensure consistent TypeScript behavior across the entire monorepo.