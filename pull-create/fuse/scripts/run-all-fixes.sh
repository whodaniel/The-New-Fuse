#!/bin/bash

set -e

echo "Running all TypeScript fixes in sequence..."

echo "Step 1: Running fix-typescript-errors.sh (if it exists)..."
if [ -f "fix-typescript-errors.sh" ]; then
    chmod +x fix-typescript-errors.sh
    ./fix-typescript-errors.sh
fi

echo "Step 2: Running fix-openai-imports.sh..."
chmod +x fix-openai-imports.sh
./fix-openai-imports.sh

echo "Step 3: Running fix-redis-issues.sh..."
chmod +x fix-redis-issues.sh
./fix-redis-issues.sh

echo "Step 4: Running fix-specific-issues.sh..."
chmod +x fix-specific-issues.sh
./fix-specific-issues.sh

echo "Step 5: Running fix-case-sensitivity.sh..."
chmod +x fix-case-sensitivity.sh
./fix-case-sensitivity.sh

echo "Step 6: Running update-tsconfig.sh..."
chmod +x update-tsconfig.sh
./update-tsconfig.sh

echo "Step 7: Fixing isolated module issues..."
for file in $(find src -type f -name "*.ts" | xargs grep -l "TS1208" 2>/dev/null || true); do
    if [ -f "$file" ]; then
        echo "export {};" >> "$file"
        echo "Fixed isolated module issue in $file"
    fi
done

echo "Step 8: Adding React DOM polyfill for reactflow..."
mkdir -p src/polyfills
cat > src/polyfills/react-polyfill.ts << 'EOL'
// filepath: src/polyfills/react-polyfill.ts
if (typeof window === 'undefined') {
  global.window = {} as any;
  global.document = {} as any;
  global.navigator = { userAgent: 'node' } as any;
  global.React = {
    createElement: () => ({}),
    Fragment: Symbol('Fragment')
  } as any;
  global.ReactDOM = {
    render: () => ({}),
    createRoot: () => ({ render: () => ({}), unmount: () => ({}) })
  } as any;
}

export {};
EOL

echo "All fixes have been applied! Try building the project now."
