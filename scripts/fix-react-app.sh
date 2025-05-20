#!/bin/bash

# Fix React Application Script
# This script addresses various issues in the React frontend application
# including cleaning build caches, fixing import issues, and ensuring proper configuration.

set -e

# Define colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define paths
ROOT_DIR="$(pwd)"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"
PACKAGES_DIR="$ROOT_DIR/packages"

# Log helper function
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Step 1: Clean the build cache
log "Step 1: Cleaning build cache..."
rm -rf node_modules/.cache
rm -rf $FRONTEND_DIR/node_modules/.cache
rm -rf $FRONTEND_DIR/dist
rm -rf $ROOT_DIR/dist

# Step 2: Fix TypeScript declaration issues
log "Step 2: Fixing TypeScript declaration issues..."
node fix-declarations.mjs

# Step 3: Clean up duplicate or conflicting component files
log "Step 3: Cleaning up duplicate or conflicting component files..."
find $ROOT_DIR/src -type f -name "*.tsx-e" -exec rm {} \;
find $ROOT_DIR/src -type f -name "*.ts-e" -exec rm {} \;

# Step 4: Update Vite configuration
log "Step 4: Updating Vite configuration..."
cat > $FRONTEND_DIR/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          target: 'es2020',
          jsx: 'react-jsx',
          strict: false
        }
      }
    }
  },
  plugins: [
    react({
      jsxImportSource: 'react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@the-new-fuse': path.resolve(__dirname, '../../packages')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'ws://localhost:3001',
        ws: true
      }
    },
    watch: {
      usePolling: true
    }
  }
});
EOF

# Step 5: Fix React imports in component files
log "Step 5: Fixing React imports in component files..."
find $ROOT_DIR/src -type f -name "*.tsx" -exec sed -i '' 's/import React, {FC} from '\''react'\'';/import React from '\''react'\'';/g' {} \;
find $ROOT_DIR/src -type f -name "*.tsx" -exec sed -i '' 's/import React, { FC } from '\''react'\'';/import React from '\''react'\'';/g' {} \;

# Add a React polyfill file for JSX transformation
log "Creating React polyfill file..."
mkdir -p $FRONTEND_DIR/src/polyfills
cat > $FRONTEND_DIR/src/polyfills/react-polyfill.ts << 'EOF'
/**
 * This file provides polyfills for React JSX runtime
 * to ensure components will work properly with the build system
 */

import * as React from 'react';

// Make React available globally to support components that don't import it
window.React = React;

export {};
EOF

# Step 6: Create a proper entry point for the frontend app
log "Step 6: Creating a proper entry point for the frontend app..."
mkdir -p $FRONTEND_DIR/src
cat > $FRONTEND_DIR/src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './polyfills/react-polyfill';
import './styles/index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
EOF

# Create a simple App.tsx if it doesn't exist
if [ ! -f "$FRONTEND_DIR/src/App.tsx" ]; then
  log "Creating a basic App component..."
  cat > $FRONTEND_DIR/src/App.tsx << 'EOF'
import React from 'react';
import { Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">The New Fuse</h1>
      <p className="text-lg mb-6">Advanced AI Communication System</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Agent Interface</h2>
          <p>UI components for interacting with AI agents</p>
        </div>
        <div className="p-6 border rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Communication Protocol</h2>
          <p>Standardized message format for inter-agent communication</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
EOF

  # Create a basic CSS file
  mkdir -p $FRONTEND_DIR/src/styles
  cat > $FRONTEND_DIR/src/styles/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 30, 30, 30;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
EOF
fi

# Step 7: Create a proper tsconfig.json for the frontend app
log "Step 7: Updating TypeScript configuration..."
cat > $FRONTEND_DIR/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "allowJs": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"],
    
    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@styles/*": ["./src/styles/*"],
      "@assets/*": ["./src/assets/*"],
      "@lib/*": ["./src/lib/*"],
      "@the-new-fuse/*": ["../../packages/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create tsconfig.node.json if it doesn't exist
cat > $FRONTEND_DIR/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# Step 8: Create a proper tailwind.config.js if it's being used
log "Step 8: Updating Tailwind CSS configuration..."
cat > $FRONTEND_DIR/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Step 9: Update the package.json to ensure all dependencies are installed
log "Step 9: Updating package.json..."
cat > $FRONTEND_DIR/package.json << 'EOF'
{
  "name": "@the-new-fuse/frontend-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "tsc && vite build",
    "build:frontend": "yarn build",
    "build:force": "vite build --force",
    "lint": "eslint . --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview --host 0.0.0.0 --port 3000",
    "clean": "rimraf dist .turbo node_modules"
  },
  "dependencies": {
    "@chakra-ui/react": "^2.8.2",
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "@firebase/app": "^0.9.25",
    "@firebase/app-types": "^0.9.0",
    "@firebase/auth": "^1.5.1",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.1.1",
    "@mui/material": "^6.4.0",
    "@the-new-fuse/core": "workspace:*",
    "@the-new-fuse/feature-suggestions": "workspace:*",
    "@the-new-fuse/types": "workspace:*",
    "axios": "^1.6.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^11.18.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-error-boundary": "^5.0.0",
    "react-router-dom": "^7.3.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^8.22.0",
    "@typescript-eslint/parser": "^8.22.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.3",
    "vite": "^6.2.1",
    "vite-tsconfig-paths": "^4.2.1"
  }
}
EOF

# Step 10: Create a postCSS config file
log "Step 10: Creating PostCSS configuration..."
cat > $FRONTEND_DIR/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Step 11: Create an index.html file
log "Step 11: Creating index.html..."
cat > $FRONTEND_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The New Fuse - AI Communication System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Step 12: Install dependencies
log "Step 12: Installing dependencies..."
cd $FRONTEND_DIR
yarn install

# Final step: Test the build
log "Final step: Testing the build..."
cd $FRONTEND_DIR
yarn build || error "Build failed. Please check the error output."

log "✅ React application has been fixed successfully!"
log "To start the development server, run:"
log "cd $FRONTEND_DIR && yarn dev"

exit 0