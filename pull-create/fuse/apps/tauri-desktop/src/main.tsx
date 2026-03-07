/**
 * The New Fuse - Tauri Desktop Application Entry Point
 * "World Class or Nothing"
 */
import './styles.css';
import './styles/globals.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Mount the React application
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element. Check index.html for <div id="root">');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log startup
console.log('🔥 The New Fuse - Tauri Desktop initialized');
console.log('📊 Performance monitoring: Press Ctrl+Shift+P to toggle');
