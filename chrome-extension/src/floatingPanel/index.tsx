import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingPanel from './FloatingPanel'; // Assuming FloatingPanel.tsx is in the same directory
import { Logger } from '../utils/logger';

const panelLogger = new Logger({ name: 'FloatingPanelIndex', level: 'info' });

const rootElement = document.getElementById('floating-panel-react-root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <FloatingPanel />
    </React.StrictMode>
  );
  panelLogger.info('FloatingPanel rendered into #floating-panel-react-root');
} else {
  panelLogger.error('#floating-panel-react-root element not found in floatingPanel.html. Panel will not render.');
}

// Listen for messages to toggle visibility (this is a common pattern)
// The FloatingPanel component itself will handle its internal state for visibility.
// This listener ensures that messages from background/popup can trigger it.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_FLOATING_PANEL') {
    // The FloatingPanel component should have its own internal logic
    // to respond to this message, perhaps by updating its state.
    // This message is more of a signal.
    // If direct DOM manipulation is needed from here (e.g. to show/hide the iframe itself),
    // that would be handled by the content script that *creates* the iframe.
    // However, the iframe's content (this script) can control its own content's visibility.
    panelLogger.info('TOGGLE_FLOATING_PANEL message received in floatingPanel/index.tsx');
    // Forward this message to the FloatingPanel component if it's designed to listen for it,
    // or the component might already be listening for chrome.runtime.onMessage itself.
    // For now, assume FloatingPanel.tsx handles its visibility based on this message.
    sendResponse({ status: 'Panel toggle acknowledged by floatingPanel/index.tsx' });
  }
  return true; // Keep channel open for async response
});