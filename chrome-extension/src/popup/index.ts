/**
 * Popup script for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { ThemeManager } from './theme-manager.js';
import { ConnectionStatusManager } from './connection-status.js';
import { TabManager } from './tab-manager.js';
import { ChatManager } from './chat-manager.js';
import { AccessibilityManager } from './accessibility.js';
import { FileTransferManager } from '../utils/file-transfer.js';
import { CodeSnippetsManager } from '../utils/code-snippets.js';
import { AIModelsManager } from '../utils/ai-models.js';
import { WebSocketManager } from '../utils/websocket-manager.js';
import { serverManagement } from './server-management.js'; // Import server management module
import { HeaderConnectionManager } from './header-connection.js'; // Import header connection manager

// Create a popup-specific logger
const popupLogger = new Logger({
  name: 'Popup',
  level: 'info',
  saveToStorage: true
});

// Log startup
popupLogger.info('Popup script loaded');

// Create managers
const themeManager = new ThemeManager();
const connectionManager = new ConnectionStatusManager();
const tabManager = new TabManager();
const chatManager = new ChatManager(connectionManager);
const headerConnectionManager = new HeaderConnectionManager(connectionManager);
const accessibilityManager = new AccessibilityManager();

// Initialize popup when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize managers
  tabManager.initialize();
  chatManager.initialize();
  serverManagement.initialize(); // Initialize server management
  headerConnectionManager.initialize(); // Initialize header connection UI

  // Initialize accessibility features
  accessibilityManager.setupKeyboardNavigation();
  accessibilityManager.addAriaAttributes();

  // Initialize theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      themeManager.toggleTheme();
    });
  }

  // Initialize settings button
  const settingsButton = document.getElementById('settings-button');
  const settingsView = document.getElementById('settings-view');
  const mainView = document.getElementById('main-view');
  const backToMainButton = document.getElementById('back-to-main-button');

  if (settingsButton && settingsView && mainView && backToMainButton) {
    settingsButton.addEventListener('click', () => {
      mainView.style.display = 'none';
      settingsView.style.display = 'block';
    });

    backToMainButton.addEventListener('click', () => {
      settingsView.style.display = 'none';
      mainView.style.display = 'block';
    });
  }

  // Initialize settings
  initializeSettings();

  // Initialize tools
  initializeTools();

  popupLogger.info('Popup initialized');
});

/**
 * Initialize settings
 */
function initializeSettings(): void {
  // Get settings elements
  const saveSettingsButton = document.getElementById('save-settings-button');
  const resetDefaultsButton = document.getElementById('reset-defaults-button');
  const testConnectionButton = document.getElementById('test-connection-button');
  const testWsButton = document.getElementById('test-ws-button');
  const reconnectButton = document.getElementById('reconnect-button');
  const refreshTokenButton = document.getElementById('refresh-token');
  const clearAuthButton = document.getElementById('clear-auth');
  const exportLogsButton = document.getElementById('export-logs');
  const clearChatButton = document.getElementById('clear-chat');

  // Get accessibility settings elements
  const highContrastCheckbox = document.getElementById('high-contrast') as HTMLInputElement;
  const largeTextCheckbox = document.getElementById('large-text') as HTMLInputElement;
  const reducedMotionCheckbox = document.getElementById('reduced-motion') as HTMLInputElement;
  const keyboardNavigationCheckbox = document.getElementById('keyboard-navigation') as HTMLInputElement;
  const screenReaderCheckbox = document.getElementById('screen-reader') as HTMLInputElement;

  // Load settings
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
    if (response && response.success) {
      const settings = response.settings;

      // Update settings UI
      const wsProtocolSelect = document.getElementById('ws-protocol') as HTMLSelectElement;
      const wsHostInput = document.getElementById('ws-host') as HTMLInputElement;
      const wsPortInput = document.getElementById('ws-port') as HTMLInputElement;
      const relayUrlInput = document.getElementById('relay-url') as HTMLInputElement;
      const autoConnectCheckbox = document.getElementById('auto-connect') as HTMLInputElement;
      const showNotificationsCheckbox = document.getElementById('show-notifications') as HTMLInputElement;
      const saveChatHistoryCheckbox = document.getElementById('save-chat-history') as HTMLInputElement;
      const debugModeCheckbox = document.getElementById('debug-mode') as HTMLInputElement;
      const autoDetectCodeCheckbox = document.getElementById('auto-detect-code') as HTMLInputElement;
      const useCompressionCheckbox = document.getElementById('use-compression') as HTMLInputElement;

      if (wsProtocolSelect) wsProtocolSelect.value = settings.wsProtocol || 'ws';
      if (wsHostInput) wsHostInput.value = settings.wsHost || 'localhost';
      if (wsPortInput) wsPortInput.value = settings.wsPort?.toString() || '3712';
      if (relayUrlInput) relayUrlInput.value = settings.relayUrl || 'https://localhost:3000';
      if (autoConnectCheckbox) autoConnectCheckbox.checked = settings.autoConnect !== false;
      if (showNotificationsCheckbox) showNotificationsCheckbox.checked = settings.showNotifications !== false;
      if (saveChatHistoryCheckbox) saveChatHistoryCheckbox.checked = settings.saveChatHistory !== false;
      if (debugModeCheckbox) debugModeCheckbox.checked = settings.debugMode === true;
      if (autoDetectCodeCheckbox) autoDetectCodeCheckbox.checked = settings.autoDetectCode !== false;
      if (useCompressionCheckbox) useCompressionCheckbox.checked = settings.useCompression !== false;

      // Update connection info
      const wsConnectionInfo = document.getElementById('ws-connection-info');
      if (wsConnectionInfo) {
        wsConnectionInfo.textContent = `${settings.wsProtocol || 'ws'}://${settings.wsHost || 'localhost'}:${settings.wsPort || '3712'}`;
      }
    }
  });

  // Get auth status
  chrome.runtime.sendMessage({ type: 'AUTH_STATUS' }, (response) => {
    if (response && response.success) {
      const authStatusText = document.getElementById('auth-status-text');
      const tokenValidity = document.getElementById('token-validity');
      const tokenExpiry = document.getElementById('token-expiry');

      if (authStatusText) authStatusText.textContent = response.state || 'Unknown';
      if (tokenValidity) tokenValidity.textContent = response.tokenValid ? 'Valid' : 'Invalid';
      if (tokenExpiry) tokenExpiry.textContent = response.tokenExpiry ? new Date(response.tokenExpiry).toLocaleString() : 'None';
    }
  });

  // Initialize accessibility settings
  if (highContrastCheckbox || largeTextCheckbox || reducedMotionCheckbox ||
      keyboardNavigationCheckbox || screenReaderCheckbox) {
    // Get current settings
    const accessSettings = accessibilityManager.getSettings();

    // Update UI
    if (highContrastCheckbox) highContrastCheckbox.checked = accessSettings.highContrast;
    if (largeTextCheckbox) largeTextCheckbox.checked = accessSettings.largeText;
    if (reducedMotionCheckbox) reducedMotionCheckbox.checked = accessSettings.reducedMotion;
    if (keyboardNavigationCheckbox) keyboardNavigationCheckbox.checked = accessSettings.keyboardNavigation;
    if (screenReaderCheckbox) screenReaderCheckbox.checked = accessSettings.screenReader;

    // Add event listeners
    if (highContrastCheckbox) {
      highContrastCheckbox.addEventListener('change', () => {
        accessibilityManager.updateSettings({ highContrast: highContrastCheckbox.checked });
      });
    }

    if (largeTextCheckbox) {
      largeTextCheckbox.addEventListener('change', () => {
        accessibilityManager.updateSettings({ largeText: largeTextCheckbox.checked });
      });
    }

    if (reducedMotionCheckbox) {
      reducedMotionCheckbox.addEventListener('change', () => {
        accessibilityManager.updateSettings({ reducedMotion: reducedMotionCheckbox.checked });
      });
    }

    if (keyboardNavigationCheckbox) {
      keyboardNavigationCheckbox.addEventListener('change', () => {
        accessibilityManager.updateSettings({ keyboardNavigation: keyboardNavigationCheckbox.checked });
      });
    }

    if (screenReaderCheckbox) {
      screenReaderCheckbox.addEventListener('change', () => {
        accessibilityManager.updateSettings({ screenReader: screenReaderCheckbox.checked });
      });
    }
  }

  // Add event listeners
  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', () => {
      // Get settings from UI
      const wsProtocol = (document.getElementById('ws-protocol') as HTMLSelectElement)?.value || 'ws';
      const wsHost = (document.getElementById('ws-host') as HTMLInputElement)?.value || 'localhost';
      const wsPort = parseInt((document.getElementById('ws-port') as HTMLInputElement)?.value || '3712', 10);
      const relayUrl = (document.getElementById('relay-url') as HTMLInputElement)?.value || 'https://localhost:3000';
      const autoConnect = (document.getElementById('auto-connect') as HTMLInputElement)?.checked !== false;
      const showNotifications = (document.getElementById('show-notifications') as HTMLInputElement)?.checked !== false;
      const saveChatHistory = (document.getElementById('save-chat-history') as HTMLInputElement)?.checked !== false;
      const debugMode = (document.getElementById('debug-mode') as HTMLInputElement)?.checked === true;
      const autoDetectCode = (document.getElementById('auto-detect-code') as HTMLInputElement)?.checked !== false;
      const useCompression = (document.getElementById('use-compression') as HTMLInputElement)?.checked !== false;

      // Save settings
      chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings: {
          wsProtocol,
          wsHost,
          wsPort,
          relayUrl,
          autoConnect,
          showNotifications,
          saveChatHistory,
          debugMode,
          autoDetectCode,
          useCompression
        }
      }, (response) => {
        if (response && response.success) {
          showNotification('Settings saved');
        } else {
          showError(response?.error || 'Failed to save settings');
        }
      });
    });
  }

  if (resetDefaultsButton) {
    resetDefaultsButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        chrome.runtime.sendMessage({
          type: 'SAVE_SETTINGS',
          settings: {
            wsProtocol: 'ws',
            wsHost: 'localhost',
            wsPort: 3712,
            relayUrl: 'https://localhost:3000',
            autoConnect: true,
            showNotifications: true,
            saveChatHistory: true,
            debugMode: false,
            autoDetectCode: true,
            useCompression: true
          }
        }, (response) => {
          if (response && response.success) {
            showNotification('Settings reset to defaults');
            // Reload settings
            window.location.reload();
          } else {
            showError(response?.error || 'Failed to reset settings');
          }
        });
      }
    });
  }

  if (testConnectionButton) {
    testConnectionButton.addEventListener('click', () => {
      const relayUrl = (document.getElementById('relay-url') as HTMLInputElement)?.value;
      if (!relayUrl) {
        showError('API URL is required');
        return;
      }

      showNotification('Testing API connection...');

      fetch(`${relayUrl}/status`, { method: 'GET' })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(`API returned ${response.status}`);
        })
        .then(data => {
          if (data.status === 'ok') {
            showNotification('API connection successful');
          } else {
            showError(`API status: ${data.status || 'unknown'}`);
          }
        })
        .catch(error => {
          showError(`API connection failed: ${error.message}`);
        });
    });
  }

  if (testWsButton) {
    testWsButton.addEventListener('click', () => {
      const protocol = (document.getElementById('ws-protocol') as HTMLSelectElement)?.value || 'ws';
      const host = (document.getElementById('ws-host') as HTMLInputElement)?.value || 'localhost';
      const port = (document.getElementById('ws-port') as HTMLInputElement)?.value || '3712';

      const wsUrl = `${protocol}://${host}:${port}`;
      showNotification(`Testing WebSocket connection to ${wsUrl}...`);

      try {
        const testWs = new WebSocket(wsUrl);

        testWs.onopen = () => {
          showNotification('WebSocket connection successful');
          testWs.close();
        };

        testWs.onerror = () => {
          showError('WebSocket connection failed');
          testWs.close();
        };
      } catch (error) {
        showError(`WebSocket connection error: ${(error as Error).message}`);
      }
    });
  }

  if (reconnectButton) {
    reconnectButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'CONNECT' }, (response) => {
        if (response && response.success) {
          showNotification('Connection request sent');
        } else {
          showError(response?.error || 'Failed to send connection request');
        }
      });
    });
  }

  if (refreshTokenButton) {
    refreshTokenButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'REFRESH_TOKEN' }, (response) => {
        if (response && response.success) {
          showNotification('Token refreshed successfully');

          // Update authentication display
          chrome.runtime.sendMessage({ type: 'AUTH_STATUS' }, (authResponse) => {
            if (authResponse) {
              const authStatusText = document.getElementById('auth-status-text');
              const tokenValidity = document.getElementById('token-validity');
              const tokenExpiry = document.getElementById('token-expiry');

              if (authStatusText) authStatusText.textContent = authResponse.state || 'Unknown';
              if (tokenValidity) tokenValidity.textContent = authResponse.tokenValid ? 'Valid' : 'Invalid';
              if (tokenExpiry) tokenExpiry.textContent = authResponse.tokenExpiry ? new Date(authResponse.tokenExpiry).toLocaleString() : 'None';
            }
          });
        } else {
          showError(response?.error || 'Token refresh failed');
        }
      });
    });
  }

  if (clearAuthButton) {
    clearAuthButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear authentication data?')) {
        chrome.runtime.sendMessage({ type: 'CLEAR_AUTH' }, (response) => {
          if (response && response.success) {
            showNotification('Authentication data cleared');

            const authStatusText = document.getElementById('auth-status-text');
            const tokenValidity = document.getElementById('token-validity');
            const tokenExpiry = document.getElementById('token-expiry');

            if (authStatusText) authStatusText.textContent = 'Not Authenticated';
            if (tokenValidity) tokenValidity.textContent = 'Invalid';
            if (tokenExpiry) tokenExpiry.textContent = 'None';
          } else {
            showError('Failed to clear authentication data');
          }
        });
      }
    });
  }

  if (exportLogsButton) {
    exportLogsButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'EXPORT_LOGS' }, (response) => {
        if (response && response.success) {
          // Create downloadable blob
          const blob = new Blob([response.logs], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          // Create download link and click it
          const a = document.createElement('a');
          a.href = url;
          a.download = `thefuse_logs_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          showNotification('Logs exported successfully');
        } else {
          showError(response?.error || 'Failed to export logs');
        }
      });
    });
  }

  if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the chat history?')) {
        // Clear chat history
        chatManager.clearChat();
        showNotification('Chat history cleared');
      }
    });
  }

  // Initialize about section buttons
  const openDocsButton = document.getElementById('open-docs');
  const openWebUiButton = document.getElementById('open-web-ui');
  const openOptionsButton = document.getElementById('open-options');

  if (openDocsButton) {
    openDocsButton.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/user/repo/wiki' });
    });
  }

  if (openWebUiButton) {
    openWebUiButton.addEventListener('click', () => {
      const relayUrl = (document.getElementById('relay-url') as HTMLInputElement)?.value;
      if (relayUrl) {
        chrome.tabs.create({ url: relayUrl });
      }
    });
  }

  if (openOptionsButton) {
    openOptionsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
}

/**
 * Initialize tools
 */
function initializeTools(): void {
  // Get tool buttons
  const openMainAppBtn = document.getElementById('open-main-app');
  const dashboardBtn = document.getElementById('open-dashboard');
  const codeAnalysisBtn = document.getElementById('code-analysis');
  const codeGenBtn = document.getElementById('code-generation');
  const aiAssistBtn = document.getElementById('ai-assistant');
  const fileBrowserBtn = document.getElementById('file-browser');
  const terminalBtn = document.getElementById('terminal-access');
  const debugBtn = document.getElementById('debug-tools');

  // Add event listeners
  if (openMainAppBtn) {
    openMainAppBtn.addEventListener('click', () => {
      showButtonFeedback(openMainAppBtn);
      chrome.runtime.sendMessage({
        type: 'OPEN_VSCODE_VIEW',
        view: 'main'
      }, (response) => {
        if (!response || !response.success) {
          showError(response?.error || 'Failed to open main application');
        } else {
          showNotification('Opening main application in VS Code');
        }
      });
    });
  }

  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      showButtonFeedback(dashboardBtn);
      chrome.runtime.sendMessage({
        type: 'OPEN_VSCODE_VIEW',
        view: 'dashboard'
      }, (response) => {
        if (!response || !response.success) {
          showError(response?.error || 'Failed to open dashboard');
        } else {
          showNotification('Opening dashboard in VS Code');
        }
      });
    });
  }

  if (codeAnalysisBtn) {
    codeAnalysisBtn.addEventListener('click', () => {
      showButtonFeedback(codeAnalysisBtn);
      const codeSnippets = document.querySelectorAll('#code-snippets .code-snippet pre');
      if (codeSnippets.length === 0) {
        showError('No code to analyze');
        return;
      }

      // Get the most recent code snippet
      const latestCode = codeSnippets[codeSnippets.length - 1].textContent;

      chrome.runtime.sendMessage({
        type: 'CODE_ANALYSIS',
        code: latestCode
      }, (response) => {
        if (!response || !response.success) {
          showError(response?.error || 'Failed to analyze code');
        } else {
          showNotification('Code sent for analysis');
        }
      });
    });
  }

  if (codeGenBtn) {
    codeGenBtn.addEventListener('click', () => {
      showButtonFeedback(codeGenBtn);
      // Show prompt dialog for code generation
      const prompt = window.prompt('Enter code generation prompt:', '');
      if (!prompt) return;

      chrome.runtime.sendMessage({
        type: 'AI_ASSISTANT_QUERY',
        query: `Generate code: ${prompt}`
      }, (response) => {
        if (!response || !response.success) {
          showError(response?.error || 'Failed to generate code');
        } else {
          showNotification('Code generation request sent');
        }
      });
    });
  }

  if (aiAssistBtn) {
    aiAssistBtn.addEventListener('click', () => {
      showButtonFeedback(aiAssistBtn);
      // Show prompt dialog for AI assistance
      const prompt = window.prompt('Ask the AI assistant:', '');
      if (!prompt) return;

      chrome.runtime.sendMessage({
        type: 'AI_ASSISTANT_QUERY',
        query: prompt
      }, (response) => {
        if (!response || !response.success) {
          showError(response?.error || 'Failed to send query to AI assistant');
        } else {
          showNotification('Query sent to AI assistant');
        }
      });
    });
  }

  if (fileBrowserBtn) {
    fileBrowserBtn.addEventListener('click', () => {
      showButtonFeedback(fileBrowserBtn);
      chrome.runtime.sendMessage({
        type: 'OPEN_VSCODE_VIEW',
        view: 'file-browser'
      }, (response) => {
        if (!response || !response.success) {
          showError(response?.error || 'Failed to open file browser');
        } else {
          showNotification('Opening file browser in VS Code');
        }
      });
    });
  }

  if (terminalBtn) {
    terminalBtn.addEventListener('click', () => {
      showButtonFeedback(terminalBtn);
      const command = window.prompt('Enter terminal command:', '');
      if (!command) return;

      chrome.runtime.sendMessage({
        type: 'TERMINAL_COMMAND',
        command: command
      }, (response) => {
        if (!response || !response.success) {
          showError(response?.error || 'Failed to execute terminal command');
        } else {
          showNotification('Terminal command sent');
        }
      });
    });
  }

  if (debugBtn) {
    debugBtn.addEventListener('click', () => {
      showButtonFeedback(debugBtn);
      // Open the debug tools page in a new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('debug-tools.html') });
    });
  }
}

/**
 * Show button feedback
 * @param button - Button element
 */
function showButtonFeedback(button: HTMLElement): void {
  button.classList.add('clicked');
  setTimeout(() => {
    button.classList.remove('clicked');
  }, 200);
}

/**
 * Show notification
 * @param message - Notification message
 */
function showNotification(message: string): void {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Show error
 * @param message - Error message
 */
function showError(message: string): void {
  const error = document.createElement('div');
  error.className = 'notification error';
  error.textContent = message;

  document.body.appendChild(error);

  // Animate in
  setTimeout(() => {
    error.classList.add('show');
  }, 10);

  // Remove after delay
  setTimeout(() => {
    error.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(error);
    }, 300);
  }, 5000);
}
