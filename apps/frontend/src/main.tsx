import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ui/toast';
import { AuthProvider } from './providers/AuthProvider';
import './styles/globals.css'; // Re-add global CSS import
import { unstoppableDomainsService } from './services/unstoppableDomains.service';

// Custom Element Guard
// Prevents collisions with already defined custom elements (like mce-autosize-textarea)
if (typeof customElements !== 'undefined') {
  const originalDefine = customElements.define;
  customElements.define = function (name, constructor, options) {
    if (customElements.get(name)) {
      console.warn(`Custom element '${name}' has already been defined. Skipping.`);
      return;
    }
    originalDefine.call(customElements, name, constructor, options);
  };
  console.log('[The New Fuse] Custom Element Guard initialized');
}

// Initialize Unstoppable Domains Service
const udClientId = import.meta.env.VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID;
if (udClientId) {
  try {
    unstoppableDomainsService.initialize({
      clientID: udClientId,
      redirectUri: import.meta.env.VITE_UNSTOPPABLE_DOMAINS_REDIRECT_URI || `${window.location.origin}/auth/unstoppable-callback`,
    });
    console.log('[The New Fuse] Unstoppable Domains service initialized');
  } catch (e) {
    console.error('[The New Fuse] Failed to initialize Unstoppable Domains service:', e);
  }
} else {
    console.warn('[The New Fuse] Unstoppable Domains Client ID not found. Service not initialized.');
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
