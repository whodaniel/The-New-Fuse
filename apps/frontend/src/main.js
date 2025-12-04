import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './providers/AuthProvider';
import { ToastProvider } from './components/ui/toast';
import './styles/globals.css'; // Re-add global CSS import
console.log('Main.tsx starting...');
var container = document.getElementById('root');
console.log('Container found:', container);
if (!container) {
    throw new Error('Root element not found');
}
var root = createRoot(container);
console.log('About to render React app...');
try {
    root.render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsx(ToastProvider, { children: _jsx(App, {}) }) }) }) }));
    console.log('React app rendered successfully');
}
catch (error) {
    console.error('Error rendering React app:', error);
}
