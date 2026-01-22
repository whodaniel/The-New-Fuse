// The New Fuse - Chrome Extension Popup Script

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializePopup);

// Global connection state
let connectionStatus = {
  vscode: false,
  relay: false,
  auth: 'unauthenticated',
};

// Initialize popup
function initializePopup() {
  console.log('Initializing popup UI...');

  // Initialize tabs
  initializeTabs();

  // Initialize theme
  initializeTheme();

  // Initialize connection status
  checkConnectionStatus();

  // Initialize various components
  initializeHomeTab();
  initializeConnectionTab();
  initializeAITab();
  initializeCodeTab();
  initializeSettingsTab();

  // Set up message listeners for background script communication
  setupMessageListeners();

  // --- WebSocket Connection UI ---
  setupWebSocketUI();

  console.log('Popup UI initialized');
}

// Initialize tabs
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Update active tab content
      tabContents.forEach((content) => content.classList.remove('active'));
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      // Save active tab to storage
      chrome.storage.local.set({ activeTab: tabId });
    });
  });

  // Load saved active tab
  chrome.storage.local.get(['activeTab'], (result) => {
    if (result.activeTab) {
      const savedTabButton = document.querySelector(`.tab-button[data-tab="${result.activeTab}"]`);
      if (savedTabButton) {
        savedTabButton.click();
      }
    }
  });
}

// Initialize theme
function initializeTheme() {
  const themeToggle = document.getElementById('theme-toggle');

  // Load saved theme
  chrome.storage.local.get(['darkTheme'], (result) => {
    if (result.darkTheme) {
      document.body.classList.add('dark-theme');
      const themeStylesheet = document.getElementById('theme-stylesheet');
      if (themeStylesheet) {
        themeStylesheet.href = 'dark-theme.css';
      }
    } else {
      document.body.classList.remove('dark-theme');
      const themeStylesheet = document.getElementById('theme-stylesheet');
      if (themeStylesheet) {
        themeStylesheet.href = 'light-theme.css';
      }
    }
  });

  // Theme toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDarkTheme = document.body.classList.contains('dark-theme');

      if (isDarkTheme) {
        document.body.classList.remove('dark-theme');
        const themeStylesheet = document.getElementById('theme-stylesheet');
        if (themeStylesheet) {
          themeStylesheet.href = 'light-theme.css';
        }
        chrome.storage.local.set({ darkTheme: false });
      } else {
        document.body.classList.add('dark-theme');
        const themeStylesheet = document.getElementById('theme-stylesheet');
        if (themeStylesheet) {
          themeStylesheet.href = 'dark-theme.css';
        }
        chrome.storage.local.set({ darkTheme: true });
      }
    });
  }
}

// Check connection status
function checkConnectionStatus() {
  chrome.runtime.sendMessage({ type: 'CHECK_RELAY' }, (response) => {
    if (response) {
      updateConnectionStatus(response);
    }
  });
}

// Update connection status UI
function updateConnectionStatus(status) {
  connectionStatus = status;

  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  if (statusIndicator && statusText) {
    if (status.vscode && status.relay) {
      statusIndicator.className = 'status-indicator online';
      statusText.textContent = 'Connected';
    } else if (status.vscode) {
      statusIndicator.className = 'status-indicator partial';
      statusText.textContent = 'Partial Connection';
    } else {
      statusIndicator.className = 'status-indicator offline';
      statusText.textContent = 'Disconnected';
    }
  }

  // Update detailed connection status if on connection tab
  updateDetailedConnectionStatus();

  // Update UI elements that depend on connection status
  updateConnectionDependentUI();
}

// Update detailed connection status in the connection tab
function updateDetailedConnectionStatus() {
  const vscodeStatus = document.getElementById('vscode-status');
  const websocketStatus = document.getElementById('websocket-status');
  const authStatus = document.getElementById('auth-status');

  if (vscodeStatus) {
    vscodeStatus.textContent = connectionStatus.vscode ? 'Connected' : 'Disconnected';
    vscodeStatus.className = 'status-value ' + (connectionStatus.vscode ? 'online' : 'offline');
  }

  if (websocketStatus) {
    websocketStatus.textContent = connectionStatus.relay ? 'Connected' : 'Disconnected';
    websocketStatus.className = 'status-value ' + (connectionStatus.relay ? 'online' : 'offline');
  }

  if (authStatus) {
    let authText = 'Not authenticated';
    let authClass = 'offline';

    if (connectionStatus.auth === 'authenticated') {
      authText = 'Authenticated';
      authClass = 'online';
    } else if (connectionStatus.auth === 'authenticating') {
      authText = 'Authenticating...';
      authClass = 'partial';
    }

    authStatus.textContent = authText;
    authStatus.className = 'status-value ' + authClass;
  }
}

// Update UI elements that depend on connection status
function updateConnectionDependentUI() {
  const sendSelectionBtn = document.getElementById('send-selection-btn');
  const extractChatBtn = document.getElementById('extract-chat-btn');
  const openViewBtn = document.getElementById('open-view-btn');
  const sendChatBtn = document.getElementById('send-chat-btn');
  const codeExecuteBtn = document.getElementById('code-execute-btn');

  const isConnected = connectionStatus.vscode;

  if (sendSelectionBtn) sendSelectionBtn.disabled = !isConnected;
  if (extractChatBtn) extractChatBtn.disabled = !isConnected;
  if (openViewBtn) openViewBtn.disabled = !isConnected;
  if (sendChatBtn) sendChatBtn.disabled = !isConnected;
  if (codeExecuteBtn) codeExecuteBtn.disabled = !isConnected;
}

// Initialize home tab - simplified for now
function initializeHomeTab() {
  console.log('Initializing home tab functionality...');
  // This function will be expanded based on your HTML structure
}

// Initialize connection tab - simplified for now
function initializeConnectionTab() {
  console.log('Initializing connection tab functionality...');
  // This function will be expanded based on your HTML structure
}

// Initialize AI tab - simplified for now
function initializeAITab() {
  console.log('Initializing AI tab functionality...');
  // This function will be expanded based on your HTML structure
}

// Initialize code tab - simplified for now
function initializeCodeTab() {
  console.log('Initializing code tab functionality...');
  // This function will be expanded based on your HTML structure
}

// Initialize settings tab - simplified for now
function initializeSettingsTab() {
  console.log('Initializing settings tab functionality...');
  // This function will be expanded based on your HTML structure
}

// --- WebSocket Connection UI ---
function setupWebSocketUI() {
  const statusEl = document.getElementById('websocket-status');
  const connectBtn = document.getElementById('websocket-connect-btn');
  const disconnectBtn = document.getElementById('websocket-disconnect-btn');
  const logEl = document.getElementById('websocket-log');

  function updateStatus(connected) {
    if (statusEl) {
      statusEl.textContent = connected ? 'Connected' : 'Disconnected';
      statusEl.className = 'status-value ' + (connected ? 'online' : 'offline');
    }
  }

  function log(msg) {
    if (logEl) {
      logEl.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'RECONNECT' }, (resp) => {
        if (resp && resp.success) {
          updateStatus(true);
          log('WebSocket connected.');
        } else {
          updateStatus(false);
          log('Failed to connect WebSocket.');
        }
      });
    });
  }
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'WEBSOCKET_DISCONNECT' }, (resp) => {
        updateStatus(false);
        log('WebSocket disconnected.');
      });
    });
  }

  // Initial status check
  chrome.runtime.sendMessage({ type: 'GET_CONNECTION_STATUS' }, (resp) => {
    updateStatus(resp && resp.connected);
    log('WebSocket status checked.');
  });
}

// Set up message listeners
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CONNECTION_STATE') {
      updateConnectionStatus(message.state);
    } else if (message.type === 'AI_RESPONSE') {
      // Handle AI responses - will be implemented with specific UI
      console.log('AI Response received:', message.response);
    } else if (message.type === 'CONNECTION_STATUS') {
      // Handle connection status updates from the WebSocketManager
      if (message.payload && message.payload.status) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');

        if (statusIndicator && statusText) {
          // Update the status indicator based on the connection status
          switch (message.payload.status) {
            case 'connected':
              statusIndicator.className = 'status-indicator online';
              statusText.textContent = 'Connected';
              break;
            case 'connecting':
              statusIndicator.className = 'status-indicator partial';
              statusText.textContent = 'Connecting...';
              break;
            case 'authenticating':
              statusIndicator.className = 'status-indicator partial';
              statusText.textContent = 'Authenticating...';
              break;
            case 'error':
              statusIndicator.className = 'status-indicator error';
              statusText.textContent = 'Connection Error';
              break;
            default:
              statusIndicator.className = 'status-indicator offline';
              statusText.textContent = 'Disconnected';
          }
        }

        // Update detailed connection status if on connection tab
        updateDetailedConnectionStatus();

        // Update UI elements that depend on connection status
        updateConnectionDependentUI();
      }
    } else if (message.type === 'LLM_RESPONSE') {
      // Handle LLM response from VS Code
      console.log('LLM Response received:', message.payload);
    } else if (message.type === 'ERROR_MESSAGE') {
      // Handle error messages
      if (message.payload && message.payload.message) {
        showNotification(`Error: ${message.payload.message}`, true);
      }
    }
  });
}

// Show notification
function showNotification(message, isError = false) {
  let notificationsContainer = document.getElementById('notifications-container');
  if (!notificationsContainer) {
    // Create notifications container if it doesn't exist
    notificationsContainer = document.createElement('div');
    notificationsContainer.id = 'notifications-container';
    notificationsContainer.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(notificationsContainer);
  }

  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;
  notification.style.cssText = `
    background: ${isError ? '#dc3545' : '#28a745'};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    pointer-events: auto;
    font-size: 14px;
    max-width: 300px;
    word-wrap: break-word;
  `;

  notificationsContainer.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Remove notification after a delay
  setTimeout(
    () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notificationsContainer.contains(notification)) {
          notificationsContainer.removeChild(notification);
        }
      }, 300);
    },
    isError ? 5000 : 3000
  );
}
