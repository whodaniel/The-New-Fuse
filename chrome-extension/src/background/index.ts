/**
 * Background script for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { ConnectionManager } from './connection-manager.js';
import { MessageHandler } from './message-handler.js';

// Create a background-specific logger
const backgroundLogger = new Logger({
  name: 'Background',
  level: 'info',
  saveToStorage: true
});

// Log startup
backgroundLogger.info('Background script loaded');

// Create connection manager
const connectionManager = new ConnectionManager();

// Create message handler
const messageHandler = new MessageHandler(connectionManager, backgroundLogger);

// Initialize
async function initialize() {
  try {
    backgroundLogger.info('Beginning initialization sequence');
    
    // Step 1: Remove any existing context menus
    await new Promise<void>((resolve) => {
      chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) {
          backgroundLogger.error('Error removing all context menus:', chrome.runtime.lastError.message);
          // Decide if this error is critical enough to stop initialization
          // For now, we log and continue, as this was the previous behavior.
        }
        resolve();
      });
    });
    backgroundLogger.info('Context menus removal step completed.');

    // Step 2: Initialize message handler
    messageHandler.initialize();
    backgroundLogger.info('Message handler initialized.');

    // Step 3: Initialize connection manager with proper error handling
    try {
      await connectionManager.initialize();
      backgroundLogger.info('Connection manager initialized successfully.');
    } catch (connectionError) {
      backgroundLogger.warn('Connection manager initialization had issues, but continuing:', connectionError);
      // Continue execution - connection can be retried later
    }

    // Step 4: Set initial badge text and background color
    try {
      chrome.action.setBadgeText({ text: '' }); // Default empty badge
      chrome.action.setBadgeBackgroundColor({ color: '#4285f4' }); // Default color
    } catch (badgeError) {
      backgroundLogger.error('Error setting initial action badge:', badgeError);
    }

    // Step 5: Set up connection state listener
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === 'CONNECTION_STATE' && message.state) {
        updateBadge(message.state);
      }
      // Return false or undefined for synchronous listeners if not sending an async response.
      // If this listener might send an async response later, return true.
      return false;
    });

    backgroundLogger.info('Background script initialized successfully and listeners are set up.');
  } catch (error) {
    backgroundLogger.error('Critical error during background script initialization sequence:', error);
  }
}

// Update badge based on connection state
function updateBadge(state: { vscode: boolean; relay: boolean }) {
  if (state.vscode && state.relay) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#34a853' });
  } else if (state.vscode) {
    chrome.action.setBadgeText({ text: '~' });
    chrome.action.setBadgeBackgroundColor({ color: '#fbbc05' });
  } else {
    chrome.action.setBadgeText({ text: '✗' });
    chrome.action.setBadgeBackgroundColor({ color: '#ea4335' });
  }
}

// Initialize background script
initialize();
