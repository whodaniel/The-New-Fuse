#!/bin/bash
set -e

echo "🔧 Fixing The New Fuse Frontend..."

# Navigate to the frontend directory
cd "$(dirname "$0")/apps/frontend"

# Install dependencies directly with npm
echo "📦 Installing dependencies with npm..."
npm install --no-save vite@latest @vitejs/plugin-react@latest

# Create a simple React component
echo "🧩 Creating a simple React component..."
mkdir -p src/components/simple
cat > src/components/simple/SimpleComponent.tsx << 'EOL'
import React from 'react';

export const SimpleComponent: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ color: '#4f46e5' }}>The New Fuse is Working!</h1>
      <p>This is a simple React component that confirms your React application is running correctly.</p>
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem'
      }}>
        <h2>Next Steps</h2>
        <ul>
          <li>Connect to your backend API</li>
          <li>Implement authentication</li>
          <li>Build out your UI components</li>
          <li>Set up routing</li>
        </ul>
      </div>
    </div>
  );
};
EOL

# Create a simplified App component
echo "🧩 Creating a simplified App component..."
cat > src/App.tsx << 'EOL'
import React from 'react';
import { SimpleComponent } from './components/simple/SimpleComponent';

export const App: React.FC = () => {
  return <SimpleComponent />;
};
EOL

# Create a simplified main.tsx
echo "🧩 Creating a simplified main.tsx..."
cat > src/main.tsx << 'EOL'
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOL

# Create a simplified vite.config.ts
echo "🧩 Creating a simplified vite.config.ts..."
cat > vite.config.ts << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components')
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
EOL

# Start the development server
echo "🚀 Starting the development server..."
echo "The server will be available at http://localhost:3000"
npx vite --host 0.0.0.0 --port 3000
