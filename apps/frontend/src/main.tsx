import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ui/toast';
// Initialize Firebase is already handled by import './lib/firebase'
import './styles/globals.css'; // Re-add global CSS import

// Custom Element Guard: Moved to index.html for maximum interception coverage.
// The index.html guard locks the registry, so attempting to redefine define() here
// would throw a TypeError.

// Initialize Unstoppable Domains Service
try {
  const udClientId = import.meta.env.VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID;
  const isUdEnabled = import.meta.env.VITE_ENABLE_UNSTOPPABLE_DOMAINS !== 'false';

  if (udClientId && isUdEnabled) {
    try {
      unstoppableDomainsService.initialize({
        clientID: udClientId,
        redirectUri:
          import.meta.env.VITE_UNSTOPPABLE_DOMAINS_REDIRECT_URI ||
          `${window.location.origin}/auth/unstoppable-callback`,
      });
      console.log('[The New Fuse] Unstoppable Domains service initialized');
    } catch (e) {
      console.error('[The New Fuse] Failed to initialize Unstoppable Domains service:', e);
    }
  } else if (!udClientId && isUdEnabled) {
    // Silent in production, warning in development
    if (import.meta.env.DEV) {
      console.warn(
        '[The New Fuse] Unstoppable Domains Client ID not found. Service skipped. ' +
          'Set VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID in .env to enable.'
      );
    }
  }
} catch (error) {
  console.error('[The New Fuse] Critical error during Unstoppable Domains setup:', error);
}

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
