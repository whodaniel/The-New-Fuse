import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('Main.tsx loading...');

const container = document.getElementById('root');
console.log('Container found:', container);

if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

console.log('About to render App...');

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering App:', error);
}
