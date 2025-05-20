#!/bin/bash

# Fix duplicate function declarations
find packages -type f -name "*.ts" -exec sed -i '' 's/): Promise<void> (): Promise<void>/): Promise<void>/g' {} +

# Fix malformed type declarations
find packages -type f -name "*.ts" -exec sed -i '' 's/: unknown) {/): void {/g' {} +

# Fix trailing colons in object literals
find packages -type f -name "*.ts" -exec sed -i '' 's/: '\''/: /g' {} +

# Remove stray semicolons
find packages -type f -name "*.ts" -exec sed -i '' 's/;,/,/g' {} +

echo "Basic syntax fixes applied. Running TypeScript check..."
yarn tsc -p config/tsconfig.fix.phase1.json --noEmit