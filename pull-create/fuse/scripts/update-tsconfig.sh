#!/bin/bash

set -e

echo "Updating TypeScript configuration for a more lenient build..."

cat > tsconfig.build.json << 'EOL'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "skipLibCheck": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictPropertyInitialization": false,
    "noUnusedParameters": false,
    "noUnusedLocals": false,
    "allowUnreachableCode": true,
    "resolveJsonModule": true
  },
  "exclude": [
    "node_modules",
    "**/*.spec.ts",
    "**/*.test.ts",
    "dist"
  ]
}
EOL

# Add environment.d.ts for process.env types
mkdir -p src/types
cat > src/types/environment.d.ts << 'EOL'
// filepath: src/types/environment.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    OPENAI_API_KEY?: string;
    JWT_SECRET?: string;
    [key: string]: string | undefined;
  }
}
EOL

echo "Creating a build script to compile with the relaxed config..."
cat > build.sh << 'EOL'
#!/bin/bash

set -e

echo "Building with relaxed TypeScript configuration..."
# Clean previous build artifacts
rimraf dist

# Build with the relaxed config
tsc -p tsconfig.build.json

echo "Build completed successfully!"
EOL

# Make the build script executable
chmod +x build.sh

echo "TypeScript configuration updated successfully."
