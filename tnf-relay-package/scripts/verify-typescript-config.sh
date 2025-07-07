#!/bin/bash

set -e

echo "Verifying TypeScript configuration..."

# Check if tsconfig.json exists
if [ ! -f "tsconfig.json" ]; then
    echo "Creating tsconfig.json..."
    cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020", "dom"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
EOL
fi

# Verify essential TypeScript dependencies
echo "Checking TypeScript dependencies..."
if ! grep -q '"typescript":' package.json; then
    echo "Adding TypeScript dependency..."
    npm install --save-dev typescript @types/node
fi

# Check for essential type definitions
echo "Checking type definitions..."
needed_types=(
    "@types/react"
    "@types/express"
    "@types/jest"
)

for type in "${needed_types[@]}"; do
    if ! grep -q "\"$type\":" package.json; then
        echo "Adding $type..."
        npm install --save-dev "$type"
    fi
done

echo "TypeScript configuration verification complete."