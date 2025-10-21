import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './providers/AuthProvider';
import { ToastProvider } from './components/ui/toast';
import './styles/globals.css'; // Re-add global CSS import

console.log('Main.tsx starting...');

const container = document.getElementById('root');
console.log('Container found:', container);

if (!container) {
    throw new Error('Root element not found');
}

const root = createRoot(container);

console.log('About to render React app...');

try {
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <AuthProvider>
                    <ToastProvider>
                        <App />
                    </ToastProvider>
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
    console.log('React app rendered successfully');
} catch (error) {
    console.error('Error rendering React app:', error);
}
// Railway deployment trigger
// Updated deployment trigger
