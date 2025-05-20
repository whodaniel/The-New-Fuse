import { WebSocketManager } from './utils/websocket-manager';
import { FileTransferManager } from './utils/file-transfer';
import { Logger } from './utils/logger';
import { ConnectionStatusMessage } from './shared-protocol';

// Initialize a background-specific logger
const backgroundLogger = new Logger({
  name: 'Background',
  level: 'info',
  saveToStorage: true // Or false, depending on preference for background logs
});

// Initialize managers
let webSocketManager: WebSocketManager;
let fileTransferManager: FileTransferManager;

try {
  // Initialize FileTransferManager immediately
  fileTransferManager = new FileTransferManager();
  
  // Initialize WebSocketManager safely and asynchronously
  chrome.storage.local.get(['websocketUrl'], (result) => {
    const websocketUrl = result.websocketUrl || 'ws://localhost:8080';
    backgroundLogger.info('Initializing WebSocketManager with URL:', websocketUrl);
    
    // Initialize with error handling
    try {
      webSocketManager = new WebSocketManager(websocketUrl, {
        logger: backgroundLogger,
        useCompression: true,
        reconnectAttempts: 5, // Retry 5 times
        reconnectDelay: 2000 // Wait 2 seconds between attempts
      });
      
      // Add WebSocket event listeners only after initialization
      webSocketManager.on('connectionStatus', (statusPayload: ConnectionStatusMessage['payload']) => {
        backgroundLogger.info('Broadcasting WebSocket status update:', statusPayload);
        try {
          chrome.runtime.sendMessage({
            type: 'WEBSOCKET_STATUS_UPDATE',
            payload: statusPayload,
          });
        } catch (err) {
          backgroundLogger.error('Error broadcasting WebSocket status:', err);
        }
      });
      
      // Immediately set icon to show disconnected status
      chrome.action.setIcon({ 
        path: {
          16: 'icons/icon16-disconnected.png',
          48: 'icons/icon48-disconnected.png',
          128: 'icons/icon128-disconnected.png'
        }
      });
      
    } catch (err) {
      backgroundLogger.error('Failed to initialize WebSocketManager:', err);
      // Update extension icon to show error state
      chrome.action.setIcon({ 
        path: {
          16: 'icons/icon16-error.png',
          48: 'icons/icon48-error.png',
          128: 'icons/icon128-error.png'
        }
      });
    }
  });

} catch (error) {
  backgroundLogger.error('Failed to initialize managers:', error);
  // Depending on severity, might want to disable parts of the extension
}

const FLOATING_PANEL_STATE_KEY = 'floatingPanelState';

// Listen for extension startup
chrome.runtime.onStartup.addListener(() => {
  try {
    if (webSocketManager) {
      // webSocketManager.init(); // init() method doesn't exist on WebSocketManager
      // Connection is typically established by calling .connect()
      // This might be called based on user action or automatically.
      // For now, let's assume connect is called elsewhere or on demand.
      backgroundLogger.info('WebSocketManager instance created on startup.');
    } else {
      backgroundLogger.error('webSocketManager not available on startup');
    }
  } catch (error) {
    backgroundLogger.error('Error during onStartup initialization:', error);
  }
});

// Listen for extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  try {
    if (webSocketManager) {
      // webSocketManager.init(); // init() method doesn't exist
      backgroundLogger.info(`WebSocketManager instance (re)confirmed on ${details.reason}.`);
    } else {
      backgroundLogger.error('webSocketManager not available on install/update');
    }
  } catch (error) {
    backgroundLogger.error('Error during onInstalled initialization:', error);
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (!webSocketManager || !fileTransferManager) {
      backgroundLogger.error('Managers not initialized, cannot handle message:', message.type);
      sendResponse({ success: false, error: 'Background script not fully initialized.' });
      return true; // Keep channel open for async response
    }

    switch (message.type) {
      case 'GET_WEBSOCKET_STATUS': // Changed from GET_SERVER_STATUS for clarity
        sendResponse(webSocketManager.getConnectionStatus());
        break;
      case 'WEBSOCKET_CONNECT': // Changed from START_SERVER
        webSocketManager.connect().then(success => sendResponse({ success }));
        return true; // Async
      case 'WEBSOCKET_DISCONNECT': // Changed from STOP_SERVER
        webSocketManager.disconnect();
        sendResponse({ success: true });
        break;
      case 'GET_ACTIVE_TRANSFERS':
        sendResponse(Array.from(fileTransferManager.getActiveTransfers()));
        break;
      case 'GET_FLOATING_PANEL_STATE':
        chrome.storage.local.get(FLOATING_PANEL_STATE_KEY, (result) => {
          if (chrome.runtime.lastError) {
            backgroundLogger.error('Error getting floating panel state:', chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            // Send stored state or defaults if not found
            const defaultState = { isVisible: false, position: { x: 0, y: 0 } };
            sendResponse(result[FLOATING_PANEL_STATE_KEY] || defaultState);
          }
        });
        return true; // Indicates an asynchronous response
      case 'SET_FLOATING_PANEL_STATE':
        if (message.state) {
          chrome.storage.local.set({ [FLOATING_PANEL_STATE_KEY]: message.state }, () => {
            if (chrome.runtime.lastError) {
              backgroundLogger.error('Error setting floating panel state:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              backgroundLogger.info('Floating panel state saved:', message.state);
              sendResponse({ success: true });
            }
          });
        } else {
          backgroundLogger.warn('SET_FLOATING_PANEL_STATE: No state provided.');
          sendResponse({ success: false, error: 'No state provided to set.' });
        }
        return true; // Indicates an asynchronous response
      case 'TOGGLE_FLOATING_PANEL': // This message might be sent from popup to background, then to content
        // Forward this to the active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'CONTROL_IFRAME_VISIBILITY', visible: message.visible })
              .then(response => sendResponse(response))
              .catch(error => {
                backgroundLogger.error('Error forwarding TOGGLE_FLOATING_PANEL to content script:', error);
                sendResponse({ success: false, error: error.message });
              });
          } else {
            backgroundLogger.error('No active tab found to toggle floating panel.');
            sendResponse({ success: false, error: 'No active tab found.' });
          }
        });
        return true; // Indicates an asynchronous response
      case 'START_WEBSOCKET_SERVER':
        backgroundLogger.info('Starting WebSocket server...');
        
        // Use chrome.runtime.getURL to get the extension path
        const extensionPath = chrome.runtime.getURL('');
        
        // Use chrome.management to open VS Code task
        try {
          // We need to launch a VS Code task to start the WebSocket server
          // For Chrome extension, we'll use a simple approach:
          // 1. Set a localStorage flag that the VS Code extension will check
          // 2. If VS Code extension is installed, it will see this flag and start the server
          
          chrome.storage.local.set({ 
            'websocketServerStartRequested': true,
            'websocketServerStartTime': new Date().toISOString() 
          }, () => {
            // Try to open VS Code with a URL scheme that the VS Code extension can handle
            chrome.tabs.create({ 
              url: 'vscode://thefuse.startwebsocketserver',
              active: true 
            }, (tab) => {
              if (chrome.runtime.lastError) {
                backgroundLogger.error('Error opening VS Code:', chrome.runtime.lastError);
                // If opening VS Code fails, maybe VS Code is not installed or protocol not registered
                // Fallback to opening a help page
                chrome.tabs.create({ 
                  url: chrome.runtime.getURL('websocket-server-help.html'),
                  active: true 
                });
                sendResponse({ 
                  success: false, 
                  error: 'Failed to start WebSocket server. VS Code integration might not be installed.',
                  fallbackLaunched: true 
                });
              } else {
                // Success opening VS Code with the protocol
                sendResponse({ 
                  success: true, 
                  message: 'Request to start WebSocket server sent to VS Code extension.' 
                });
              }
            });
          });
        } catch (error) {
          backgroundLogger.error('Error starting WebSocket server:', error);
          sendResponse({ 
            success: false, 
            error: `Failed to start WebSocket server: ${(error as Error).message}` 
          });
        }
        return true; // Indicates an asynchronous response
      default:
        backgroundLogger.warn('Unknown message type in background:', message.type, message);
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
    }
  } catch (error) {
    backgroundLogger.error('Error handling message in background:', error, message);
    sendResponse({ success: false, error: (error as Error).message || 'Unknown error in background script' });
  }
  return true; // Keep the message channel open for async responses
});

backgroundLogger.info('Background script loaded and listeners attached.');
