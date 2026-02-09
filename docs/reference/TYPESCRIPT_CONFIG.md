# TypeScript Configuration Guide

## Base Configuration (`tsconfig.base.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "NodeNext",
    "baseUrl": ".",
    "paths": {
      "@the-new-fuse/*": ["packages/*/src"]
    }
  }
}
```

## Environment-Specific Configurations

### UI Package (`packages/ui/tsconfig.json`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": ["src/**/*"]
}
```

### API Package (`packages/api/tsconfig.json`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node", "jest"],
    "outDir": "dist"
  },
  "exclude": ["**/*.spec.ts"]
}
```

### Shared Library (`packages/shared/tsconfig.json`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

## Migration Notes
1. Always extend from `tsconfig.base.json`
2. Use path aliases for cross-package imports
3. Environment-specific types should be declared in package-level configs

> **Deprecation Notice**: Previous TypeScript configuration documents (TYPESCRIPT-FIX.md, TYPESCRIPT_FIX_GUIDE.md) have been consolidated into this reference.