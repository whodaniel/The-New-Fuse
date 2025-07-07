#!/bin/bash

set -e

echo "Setting up The New Fuse project (simple mode)..."

# Make sure node_modules exists
npm install --no-package-lock typescript@4.9.5

# Create package directories
mkdir -p packages/types/src packages/types/dist
mkdir -p packages/core/src packages/core/dist
mkdir -p packages/hooks/src packages/hooks/dist

# Create basic type index file if it doesn't exist
if [ ! -f "packages/types/src/index.ts" ]; then
  echo "Creating basic types index..."
  echo '// Basic type exports
export interface User {
  id: string;
  email: string;
  name: string;
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export interface CustomError {
  code: string;
  message: string;
  severity: ErrorSeverity;
}
' > packages/types/src/index.ts
fi

# Create basic tsconfig files
echo '{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}' > packages/types/tsconfig.json

echo '{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}' > packages/core/tsconfig.json

# Create temporary package.json files
echo '{
  "name": "@the-new-fuse/types",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}' > packages/types/package.json

echo '{
  "name": "@the-new-fuse/core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@the-new-fuse/types": "0.1.0"
  }
}' > packages/core/package.json

# Compile types package
echo "Compiling types package..."
node_modules/.bin/tsc -p packages/types/tsconfig.json

# Run TypeScript check
echo "Running TypeScript check directly..."
node scripts/direct-tsc.js

echo "Basic setup complete!"
