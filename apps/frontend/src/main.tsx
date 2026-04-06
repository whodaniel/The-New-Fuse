// @ts-nocheck
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ui/toast';
import { AuthProvider } from './providers/AuthProvider';
// Auth runtime is initialized via Supabase in hooks/providers.
import './styles/globals.css'; // Re-add global CSS import

const installMceGuard = () => {
  if (!window?.customElements) return;
  if ((window as any).__TNF_MCE_GUARD__) return;
  const registry = window.customElements;
  const originalDefine = registry.define.bind(registry);
  const originalGet = registry.get.bind(registry);

  Object.defineProperty(registry, 'define', {
    value(name, constructor, options) {
      if (name === 'mce-autosize-textarea' && originalGet(name)) {
        return;
      }
      return originalDefine(name, constructor, options);
    },
    configurable: false,
    writable: false,
  });

  (window as any).__TNF_MCE_GUARD__ = true;
};

installMceGuard();
// Custom Element Guard: Moved to index.html for maximum interception coverage.
// The index.html guard locks the registry, so attempting to redefine define() here
// would throw a TypeError.

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
