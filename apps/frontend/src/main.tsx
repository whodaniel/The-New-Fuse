import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ui/toast';
import './lib/firebase'; // Ensure Firebase is initialized early
import { AuthProvider } from './providers/AuthProvider';
import { unstoppableDomainsService } from './services/unstoppableDomains.service';
import './styles/globals.css'; // Re-add global CSS import

// Custom Element Guard
// Prevents collisions with already defined custom elements (like mce-autosize-textarea)
try {
  if (typeof customElements !== 'undefined' && !customElements.get('mce-autosize-textarea')) {
    // Basic check for existence first
    const originalDefine = customElements.define;

    // Override define with a highly resilient wrapper
    customElements.define = function (
      name: string,
      constructor: CustomElementConstructor,
      options?: ElementDefinitionOptions
    ) {
      try {
        if (customElements.get(name)) {
          // Permissive behavior: just return early instead of throwing
          console.warn(
            `[The New Fuse] Custom element '${name}' has already been defined. Skipping registration.`
          );
          return;
        }
        originalDefine.call(customElements, name, constructor, options);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        if (errorMsg.includes('already been defined')) {
          console.warn(`[The New Fuse] Suppressed collision for '${name}'`);
          return;
        }
        console.error(`[The New Fuse] Error defining custom element '${name}':`, e);
      }
    };
    console.log('[The New Fuse] Custom Element Guard initialized (Resilient)');
  }
} catch (error) {
  console.warn('[The New Fuse] Custom Element Guard initialization error:', error);
}

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
