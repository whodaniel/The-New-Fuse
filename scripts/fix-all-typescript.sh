#!/bin/bash
set -e

echo "Starting comprehensive TypeScript error fix process..."

# Phase 1: Setup and Dependencies
echo "Phase 1: Setting up dependencies..."
yarn add -D typescript @types/react @types/react-dom @types/node
yarn add reflect-metadata typeorm @prisma/client zod reactflow react
yarn add @nestjs/common @nestjs/core @nestjs/websockets rxjs

# Phase 2: Configuration Updates
echo "Phase 2: Updating TypeScript configuration..."
cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOL

# Phase 3: Fix Common Type Issues
echo "Phase 3: Fixing common type issues..."

# Create global type definitions
mkdir -p src/types
cat > src/types/global.d.ts << 'EOL'
declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
EOL

# Phase 4: Component-specific fixes
echo "Phase 4: Fixing component-specific issues..."

# Fix AuthModule types
mkdir -p src/components/auth/types
cat > src/components/auth/types/index.ts << 'EOL'
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}
EOL

# Fix ChatModule types
mkdir -p src/components/chat/types
cat > src/components/chat/types/index.ts << 'EOL'
export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: Error | null;
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
}
EOL

# Phase 5: Core Service Fixes
echo "Phase 5: Fixing core service issues..."

# Fix cache service types
mkdir -p src/core/cache/types
cat > src/core/cache/types/index.ts << 'EOL'
export interface CacheOptions {
  ttl?: number;
  namespace?: string;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
}
EOL

# Phase 6: Run Automated Fixes
echo "Phase 6: Running automated fixes..."
yarn eslint --fix 'src/**/*.{ts,tsx}'
yarn prettier --write 'src/**/*.{ts,tsx}'

# Phase 7: Verification
echo "Phase 7: Verifying fixes..."
yarn tsc --noEmit

echo "TypeScript fix process completed!"