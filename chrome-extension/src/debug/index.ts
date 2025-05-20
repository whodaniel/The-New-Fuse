/**
 * Debug tools for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { WebSocketTester } from './websocket-tester.js';
import { LogsViewer } from './logs-viewer.js';
import { DebugSettingsManager } from './settings-manager.js';

// Create a debug-specific logger
const debugLogger = new Logger({
  name: 'DebugTools',
  level: 'debug',
  saveToStorage: true
});

// Log startup
debugLogger.info('Debug tools loaded');

// Create instances
const webSocketTester = new WebSocketTester();
const logsViewer = new LogsViewer();
const settingsManager = new DebugSettingsManager();

// Initialize debug tools when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get UI elements
  const debugContainer = document.getElementById('debug-container');
  if (!debugContainer) {
    debugLogger.error('Failed to find debug container');
    return;
  }

  // Initialize WebSocket tester UI
  initializeWebSocketTester();

  // Initialize logs viewer
  logsViewer.initialize();

  // Initialize settings manager
  settingsManager.initialize();

  // Initialize tab switching
  initializeTabs();

  // Initialize back button
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.close();
    });
  }

  debugLogger.info('Debug tools initialized');
});

/**
 * Initialize WebSocket tester UI
 */
function initializeWebSocketTester(): void {
  // Get UI elements
  const wsTestUrl = document.getElementById('ws-test-url') as HTMLInputElement;
  const wsTestConnect = document.getElementById('ws-test-connect');
  const wsTestDisconnect = document.getElementById('ws-test-disconnect');
  const wsTestMessage = document.getElementById('ws-test-message') as HTMLTextAreaElement;
  const wsTestSend = document.getElementById('ws-test-send');
  const wsTestClear = document.getElementById('ws-test-clear');

  if (!wsTestUrl || !wsTestConnect || !wsTestDisconnect || !wsTestMessage || !wsTestSend || !wsTestClear) {
    debugLogger.error('Failed to find WebSocket tester UI elements');
    return;
  }

  // Set default URL
  chrome.storage.local.get(['connectionSettings'], (result) => {
    if (chrome.runtime.lastError) {
      debugLogger.error('Error getting connectionSettings:', chrome.runtime.lastError.message);
      wsTestUrl.value = 'ws://localhost:3712'; // Default fallback
      return;
    }
    if (result.connectionSettings) {
      const { wsProtocol, wsHost, wsPort } = result.connectionSettings;
      wsTestUrl.value = `${wsProtocol || 'ws'}://${wsHost || 'localhost'}:${wsPort || '3712'}`;
    } else {
      wsTestUrl.value = 'ws://localhost:3712';
    }
  });

  // Set default message
  wsTestMessage.value = JSON.stringify({
    type: 'ping',
    timestamp: Date.now()
  }, null, 2);

  // Add event listeners
  wsTestConnect.addEventListener('click', () => {
    const url = wsTestUrl.value.trim();
    if (!url) {
      return;
    }

    webSocketTester.connect(url);
  });

  wsTestDisconnect.addEventListener('click', () => {
    webSocketTester.disconnect();
  });

  wsTestSend.addEventListener('click', () => {
    const message = wsTestMessage.value.trim();
    if (!message) {
      return;
    }

    try {
      // Try to parse as JSON
      const jsonMessage = JSON.parse(message);
      webSocketTester.send(jsonMessage);
    } catch (error) {
      // Not JSON, send as is
      webSocketTester.send(message);
    }
  });

  wsTestClear.addEventListener('click', () => {
    webSocketTester.clearLog();
  });

  // Initialize UI
  webSocketTester.updateUI();
}

/**
 * Initialize tab switching
 */
function initializeTabs(): void {
  const tabs = document.querySelectorAll('.tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      if (!tabName) return;

      // Update active tab
      tabs.forEach(t => {
        t.classList.toggle('active', t === tab);
      });

      // Update active content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
      });
    });
  });
}

// Export for global access
declare global {
  interface Window {
    WebSocketTester: typeof WebSocketTester;
    webSocketTester: WebSocketTester;
  }
}

window.WebSocketTester = WebSocketTester;
window.webSocketTester = webSocketTester;
