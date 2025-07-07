#!/bin/bash
set -e

# Create config directory if it doesn't exist
mkdir -p config

# Create Phase 1 config - Basic syntax checking
cat > config/tsconfig.fix.phase1.json << 'EOL'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictFunctionTypes": false,
    "strictBindCallApply": false,
    "strictPropertyInitialization": false,
    "noImplicitThis": false,
    "alwaysStrict": false,
    "skipLibCheck": true,
    "allowJs": true,
    "checkJs": false
  }
}
EOL

# Create Phase 2 config - Module resolution
cat > config/tsconfig.fix.phase2.json << 'EOL'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictFunctionTypes": false,
    "strictBindCallApply": false,
    "strictPropertyInitialization": false,
    "noImplicitThis": false,
    "alwaysStrict": false,
    "skipLibCheck": true,
    "allowJs": true,
    "checkJs": false,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noResolve": false
  }
}
EOL

# Create Phase 3 config - Variable usage checks
cat > config/tsconfig.fix.phase3.json << 'EOL'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "strict": false,
    "skipLibCheck": true,
    "allowJs": true,
    "checkJs": false,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
EOL

# Create Phase 4 config - Full strict mode
cat > config/tsconfig.fix.phase4.json << 'EOL'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "skipLibCheck": true,
    "allowJs": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
EOL

# Make the phase script executable
chmod +x scripts/set-typescript-phase.sh

echo "✅ TypeScript phase configurations created successfully"
echo "✅ Phase script is now executable"
echo ""
echo "To start fixing TypeScript errors:"
echo "1. Run: ./scripts/set-typescript-phase.sh 1"
echo "2. Fix any errors reported in typescript-errors.log"
echo "3. Once Phase 1 is clean, proceed to Phase 2, and so on"