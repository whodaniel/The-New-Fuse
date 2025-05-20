import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './components/Popup';
import ErrorBoundary from './components/ErrorBoundary';
import './popup.css'; // Ensure styles are loaded

console.log('Popup script started. Version 1.0.1');

// Add a small delay to ensure DOM is fully loaded
setTimeout(() => {
  try {
    const container = document.getElementById('root');
    if (container) {
      console.log('Root container found, rendering Popup.');
      const root = createRoot(container);
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <Popup />
          </ErrorBoundary>
        </React.StrictMode>
      );
      console.log('Render complete.');
    } else {
      console.error('Root container #root not found in popup.html');
      // Try to add a fallback container if root is not found
      const body = document.body;
      if (body) {
        const fallbackContainer = document.createElement('div');
        fallbackContainer.id = 'root';
        body.appendChild(fallbackContainer);
        console.log('Created fallback container, attempting to render.');
        const root = createRoot(fallbackContainer);
        root.render(
          <React.StrictMode>
            <ErrorBoundary>
              <Popup />
            </ErrorBoundary>
          </React.StrictMode>
        );
      }
    }
  } catch (err) {
    console.error('Error initializing popup:', err);
    // Display a basic error message directly in the DOM
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h2>The New Fuse: Popup Error</h2>
        <p>An error occurred while initializing the extension popup:</p>
        <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${err?.message || 'Unknown error'}</pre>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}, 100);
