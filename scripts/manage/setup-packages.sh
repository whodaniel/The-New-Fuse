#!/bin/bash
set -e

# Package-specific dependencies
declare -A package_deps=(
    ["agent"]="@nestjs/common @nestjs/core rxjs"
    ["db"]="@prisma/client @prisma/extension-accelerate mysql2 sqlite3"
    ["features"]="@nestjs/common @nestjs/core rxjs"
    ["integrations"]="axios @nestjs/axios"
    ["layout"]="react react-dom @chakra-ui/react"
    ["monitoring"]="winston @sentry/node"
    ["security"]="bcryptjs jsonwebtoken"
    ["shared"]="class-validator class-transformer"
)

# Dev dependencies for all packages
common_dev_deps="typescript @types/node ts-node tsconfig-paths jest @types/jest ts-jest"

echo "🔧 Setting up package configurations..."

for package in "${!package_deps[@]}"; do
    echo "📦 Configuring package: $package"
    cd "packages/$package"
    
    # Create package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        echo '{
            "name": "@the-new-fuse/'$package'",
            "version": "1.0.0",
            "private": true,
            "main": "dist/index.js",
            "types": "dist/index.d.ts",
            "scripts": {
                "build": "tsc",
                "test": "jest",
                "lint": "eslint src --ext .ts,.tsx"
            }
        }' > package.json
    fi

    # Create tsconfig.json
    echo '{
        "extends": "../../tsconfig.base.json",
        "compilerOptions": {
            "outDir": "dist",
            "rootDir": "src",
            "composite": true,
            "declaration": true,
            "sourceMap": true,
            "paths": {
                "@the-new-fuse/*": ["../../packages/*/src"]
            }
        },
        "include": ["src"],
        "exclude": ["node_modules", "dist", "**/*.test.ts"]
    }' > tsconfig.json

    # Create .eslintrc.js
    echo 'module.exports = {
        extends: ["../../.eslintrc.js"],
        parserOptions: {
            project: "./tsconfig.json",
        },
    }' > .eslintrc.js

    # Install dependencies
    yarn add ${package_deps[$package]}
    yarn add -D $common_dev_deps

    cd ../..
done

# Create root ESLint config
echo 'module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "prettier"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended"
    ],
    rules: {
        "prettier/prettier": ["error", {
            "singleQuote": true,
            "trailingComma": "all",
            "printWidth": 100,
            "tabWidth": 2
        }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
}' > .eslintrc.js

# Create root Prettier config
echo '{
    "singleQuote": true,
    "trailingComma": "all",
    "printWidth": 100,
    "tabWidth": 2,
    "semi": true
}' > .prettierrc

# Create base tsconfig
echo '{
    "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "lib": ["ES2020", "DOM"],
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "composite": true,
        "strict": true,
        "moduleResolution": "node",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}' > tsconfig.base.json

echo "✅ Package configurations complete"