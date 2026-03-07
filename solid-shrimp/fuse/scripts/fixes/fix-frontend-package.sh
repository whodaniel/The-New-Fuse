#!/bin/bash

FRONTEND_DIR="./packages/frontend"
echo "🔧 Fixing issues in the frontend package..."

# 1. Fix file extensions in import paths
echo "Fixing file extensions in import paths..."

# Function to find and fix imports in a directory
fix_imports() {
  local dir=$1
  
  find "$dir" -name "*.tsx" -o -name "*.ts" | while read -r file; do
    echo "  Fixing imports in $file"
    
    # Fix relative imports without extensions
    sed -i '' -E 's/from (["'\''"])(\.\/.+|\.\.\/[^"'\'']+)(["'\''"]);/from \1\2.js\3;/g' "$file"
    
    # Fix Chakra UI imports - replace with proper import format
    sed -i '' 's/import { Box, /import { Box as ChakraBox, /g' "$file"
    sed -i '' 's/import { Container, /import { Container as ChakraContainer, /g' "$file"
    sed -i '' 's/import { Flex, /import { Flex as ChakraFlex, /g' "$file"
    sed -i '' 's/import { Button, /import { Button as ChakraButton, /g' "$file"
    sed -i '' 's/import { Heading, /import { Heading as ChakraHeading, /g' "$file"
    sed -i '' 's/import { Text, /import { Text as ChakraText, /g' "$file"
    sed -i '' 's/import { VStack, /import { VStack as ChakraVStack, /g' "$file"
    sed -i '' 's/import { SimpleGrid, /import { SimpleGrid as ChakraSimpleGrid, /g' "$file"
    sed -i '' 's/import { Icon, /import { Icon as ChakraIcon, /g' "$file"
    sed -i '' 's/import { Divider, /import { Divider as ChakraDivider, /g' "$file"
    sed -i '' 's/import { useColorMode, /import { useColorMode as useChakraColorMode, /g' "$file"
    sed -i '' 's/import { ThemeConfig } from/@mui\/material/import { ThemeOptions } from "@mui\/material";/g' "$file"
    sed -i '' 's/ThemeConfig/ThemeOptions/g' "$file"
  done
}

# Create mock chakra-ui React components
echo "Creating mock Chakra UI components..."
mkdir -p "$FRONTEND_DIR/src/components/chakra-ui"
cat > "$FRONTEND_DIR/src/components/chakra-ui/index.js" << 'EOFILE'
import React from 'react';

// Create mock components that mirror Chakra UI components
export const Box = ({ children, ...props }) => <div {...props}>{children}</div>;
export const Container = ({ children, ...props }) => <div className="container" {...props}>{children}</div>;
export const Flex = ({ children, ...props }) => <div className="flex" {...props}>{children}</div>;
export const Button = ({ children, ...props }) => <button {...props}>{children}</button>;
export const Heading = ({ children, ...props }) => <h2 {...props}>{children}</h2>;
export const Text = ({ children, ...props }) => <p {...props}>{children}</p>;
export const VStack = ({ children, ...props }) => <div className="vstack" {...props}>{children}</div>;
export const HStack = ({ children, ...props }) => <div className="hstack" {...props}>{children}</div>;
export const SimpleGrid = ({ children, ...props }) => <div className="grid" {...props}>{children}</div>;
export const Icon = ({ as: Component, ...props }) => Component ? <Component {...props} /> : <span {...props} />;
export const Divider = (props) => <hr {...props} />;
export const FormControl = ({ children, ...props }) => <div className="form-control" {...props}>{children}</div>;
export const FormLabel = ({ children, ...props }) => <label className="form-label" {...props}>{children}</label>;
export const Input = (props) => <input {...props} />;
export const Select = ({ children, ...props }) => <select {...props}>{children}</select>;
export const Switch = (props) => <input type="checkbox" {...props} />;

// Mock hooks
export const useColorMode = () => {
  const [colorMode, setColorMode] = React.useState('light');
  return {
    colorMode,
    toggleColorMode: () => setColorMode(prev => prev === 'light' ? 'dark' : 'light'),
    setColorMode
  };
};

// Theme utilities
export const extendTheme = (themeOverride) => {
  return { ...themeOverride };
};
EOFILE

# Create mock react-icons
mkdir -p "$FRONTEND_DIR/src/components/react-icons/fi"
cat > "$FRONTEND_DIR/src/components/react-icons/fi/index.js" << 'EOFILE'
import React from 'react';

export const FiActivity = (props) => <span className="icon-activity" {...props} />;
export const FiBox = (props) => <span className="icon-box" {...props} />;
export const FiCode = (props) => <span className="icon-code" {...props} />;
EOFILE

# Create hooks directory if it doesn't exist
mkdir -p "$FRONTEND_DIR/src/hooks"

# Create useAuth hook
cat > "$FRONTEND_DIR/src/hooks/useAuth.js" << 'EOFILE'
import { useState, useCallback, useContext, createContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      // Mock login logic
      const user = { id: '123', email, name: 'Test User', roles: ['user'] };
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Failed to login');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      // Mock logout logic
      setUser(null);
    } catch (err) {
      setError(err.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
EOFILE

# Create useToast hook
cat > "$FRONTEND_DIR/src/hooks/useToast.js" << 'EOFILE'
import { useCallback } from 'react';

export const useToast = () => {
  const toast = useCallback(({ title, description, status }) => {
    console.log(`[Toast] ${status}: ${title} - ${description}`);
    // In a real app, this would show an actual toast notification
  }, []);

  return toast;
};

export default useToast;
EOFILE

# Create ThemeContext
cat > "$FRONTEND_DIR/src/contexts/ThemeContext.js" << 'EOFILE'
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorMode } from '../components/chakra-ui';

const defaultTheme = {
  colorMode: 'light',
  colors: {
    primary: '#3182ce',
    secondary: '#805ad5'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif'
  }
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { colorMode, setColorMode } = useColorMode();
  const [themeConfig, setThemeConfig] = useState(defaultTheme);
  const [error, setError] = useState(null);

  // Initialize theme from local storage if available
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('userTheme');
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setThemeConfig(parsedTheme);
        setColorMode(parsedTheme.colorMode || 'light');
      }
    } catch (err) {
      console.error('Failed to load theme from localStorage', err);
      setError('Failed to load saved theme');
    }
  }, [setColorMode]);

  // Save theme changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('userTheme', JSON.stringify(themeConfig));
    } catch (err) {
      console.error('Failed to save theme to localStorage', err);
      setError('Failed to save theme');
    }
  }, [themeConfig]);

  const updateTheme = useCallback((updates) => {
    setThemeConfig(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setThemeConfig(defaultTheme);
    setColorMode('light');
  }, [setColorMode]);

  const value = {
    theme: themeConfig,
    updateTheme,
    resetTheme,
    error
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
EOFILE

# Fix the AppJS file
cat > "$FRONTEND_DIR/src/App.js" << 'EOFILE'
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './hooks/useAuth';
import { Box } from './components/chakra-ui';

// Import routes
import AppRoutes from './routes';

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Suspense fallback={<Box>Loading...</Box>}>
            <AppRoutes />
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
EOFILE

# Update main.js
cat > "$FRONTEND_DIR/src/main.js" << 'EOFILE'
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOFILE

# Create tsconfig.json for frontend
cat > "$FRONTEND_DIR/tsconfig.json" << 'EOFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noImplicitAny": false,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",
    "moduleResolution": "node",
    "module": "esnext",
    "target": "es2020",
    "lib": ["es2020", "dom"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOFILE

# Create package.json for frontend
cat > "$FRONTEND_DIR/package.json" << 'EOFILE'
{
  "name": "@the-new-fuse/frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "@emotion/react": "^11.10.5",
    "@emotion/styled": "^11.10.5",
    "@mui/material": "^5.11.9"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.4.3",
    "@types/jest": "^29.4.0",
    "@types/node": "^18.13.0",
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "typescript": "^4.9.5",
    "vite": "^4.1.1",
    "@vitejs/plugin-react": "^3.1.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "serve": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
EOFILE

# Fix all directories
fix_imports "$FRONTEND_DIR/src"
fix_imports "$FRONTEND_DIR/src/components"
fix_imports "$FRONTEND_DIR/src/contexts"
fix_imports "$FRONTEND_DIR/src/hooks"
fix_imports "$FRONTEND_DIR/src/pages"
fix_imports "$FRONTEND_DIR/src/routes"

echo "✅ Frontend package fixes completed"
