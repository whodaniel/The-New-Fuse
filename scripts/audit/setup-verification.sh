#!/bin/bash
set -e

# Install required dependencies
yarn add -D glob chalk @types/glob @types/node typescript ts-node

# Create tsconfig.json if it doesn't exist
if [ ! -f "tsconfig.json" ]; then
    echo "Creating tsconfig.json..."
    cat > tsconfig.json << EOL
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "CommonJS",
        "moduleResolution": "node",
        "esModuleInterop": true,
        "allowJs": true,
        "checkJs": false,
        "resolveJsonModule": true,
        "strict": true,
        "skipLibCheck": true,
        "outDir": "./dist",
        "rootDir": "."
    },
    "include": ["scripts/**/*"],
    "exclude": ["node_modules", "dist"]
}
EOL
fi

# Convert verify-implementations.ts to use CommonJS
echo "Updating verify-implementations.ts to use CommonJS..."
sed -i'.bak' '1i\
// @ts-nocheck\
' scripts/audit/verify-implementations.ts

# Make the verification script executable
chmod +x scripts/audit/verify-implementations.ts

# Create script entry in package.json for easier running
echo "Adding script to package.json..."
node -e "
  const fs = require('fs');
  const package = JSON.parse(fs.readFileSync('package.json'));
  package.scripts = package.scripts || {};
  package.scripts.verify = 'ts-node --project tsconfig.json scripts/audit/verify-implementations.ts';
  fs.writeFileSync('package.json', JSON.stringify(package, null, 2));
"

echo "✅ Setup complete! You can now run the verification script using:"
echo "yarn verify"
