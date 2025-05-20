import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.js';
import { AuthProvider } from './providers/AuthProvider.js';
import { ToastProvider } from './components/ui/toast.js'; // Import ToastProvider
import './styles/globals.css'; // Re-add global CSS import

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider> {/* Add ToastProvider here */}
                    <App />
                </ToastProvider> {/* Close ToastProvider */}
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
