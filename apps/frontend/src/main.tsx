import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ui/toast';
import './lib/firebase'; // Ensure Firebase is initialized early
import { AuthProvider } from './providers/AuthProvider';
import { unstoppableDomainsService } from './services/unstoppableDomains.service';
import './styles/globals.css'; // Re-add global CSS import
import { installChunkErrorHandlers } from './utils/chunkLoadErrorHandler';

// Custom Element Guard
// Prevents collisions with already defined custom elements (like mce-autosize-textarea)
try {
  if (typeof customElements !== 'undefined') {
    // Check if property is writable before attempting to overwrite
    const descriptor = Object.getOwnPropertyDescriptor(customElements, 'define');

    if (!descriptor || descriptor.writable || descriptor.configurable) {
      const originalDefine = customElements.define;

      // Override define with a permissive wrapper
      Object.defineProperty(customElements, 'define', {
        value: function (
          name: string,
          constructor: CustomElementConstructor,
          options?: ElementDefinitionOptions
        ) {
          try {
            if (customElements.get(name)) {
              // Permissive behavior: just return early instead of throwing
              console.warn(
                `[The New Fuse] Custom element '${name}' has already been defined. Skipping.`
              );
              return;
            }
            originalDefine.call(customElements, name, constructor, options);
          } catch (e) {
            console.error(`[The New Fuse] Error defining custom element '${name}':`, e);
            // Don't throw, let the app continue
          }
        },
        configurable: true,
        writable: true,
      });
      console.log('[The New Fuse] Custom Element Guard initialized (Permissive)');
    } else {
      console.warn('[The New Fuse] customElements.define is read-only. Guard skipped.');
    }
  }
} catch (error) {
  // Bypass on Error: Proceed even if the guard fails
  console.warn('[The New Fuse] Custom Element Guard initialization error:', error);
}

// Initialize Unstoppable Domains Service
try {
  const udClientId = import.meta.env.VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID;
  if (udClientId) {
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
  } else {
    console.warn(
      '[The New Fuse] Unstoppable Domains Client ID not found. Service not initialized.'
    );
  }
} catch (error) {
  console.error('[The New Fuse] Critical error during Unstoppable Domains setup:', error);
}

console.log('Main.tsx starting...');
console.log('VERSION CHECK: 1.0.2 - Browser Streaming Fix (WS URL & Ports)');

// Install chunk load error handlers before anything else
installChunkErrorHandlers();

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
