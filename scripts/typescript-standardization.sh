#!/bin/bash
set -e

echo "🔍 Starting TypeScript standardization process..."

# 1. Create backup
echo "📦 Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="backups/typescript_migration_${timestamp}"
mkdir -p "$backup_dir"
cp -r src apps packages tsconfig*.json "$backup_dir"

# 2. Standardize base TypeScript configuration
echo "⚙️ Creating standardized tsconfig.base.json..."
cat > tsconfig.base.json << EOL
{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  },
  "exclude": ["node_modules", "dist", "build", "coverage"]
}
EOL

# 3. Update package-specific configs
echo "🔄 Updating package-specific TypeScript configurations..."
find packages apps -name "tsconfig.json" -type f -exec sh -c '
  echo "Updating $(dirname {})/tsconfig.json"
  cat > "{}" << EOL
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOL
' \;

# 4. Convert JavaScript files to TypeScript
echo "🔄 Converting JavaScript files to TypeScript..."
find src apps packages -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/dist/*" -exec sh -c '
  if [ ! -f "${1%.js}.ts" ]; then
    echo "Converting $1 to TypeScript..."
    cp "$1" "${1%.js}.ts"
    rm "$1"
  fi
' sh {} \;

echo "✅ TypeScript standardization complete!"