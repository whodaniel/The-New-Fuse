import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ui/toast';
import { AuthProvider } from './providers/AuthProvider';
import './styles/globals.css'; // Re-add global CSS import

// Custom Element Guard is already activated in index.html
// We just verify it's in place here
if (typeof customElements !== 'undefined') {
  console.log('[The New Fuse] Custom Element Guard check: Active');
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
      {/* Temporary debug render */}
      {/* <BrowserRouter>
                 <AuthProvider>
                    <ToastProvider>
                        <div style={{border: '5px solid blue'}}>
                            <LandingRedesigned />
                        </div>
                    </ToastProvider>
                 </AuthProvider>
            </BrowserRouter> */}
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
