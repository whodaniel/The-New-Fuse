/**
 * Debug tools for The New Fuse Chrome extension
 * Provides utilities for testing and debugging WebSocket connections
 */

// Create a debug-specific logger
const debugLogger = new Logger({
  name: 'DebugTools',
  level: 'debug',
  saveToStorage: true
});

// WebSocket connection tester
class WebSocketTester {
  constructor() {
    this.ws = null;
    this.connectionState = 'disconnected';
    this.messageLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Connect to a WebSocket server
   * @param {string} url - WebSocket URL
   * @returns {Promise<boolean>} - Whether connection was successful
   */
  connect(url) {
    return new Promise((resolve) => {
      try {
        debugLogger.info(`Connecting to WebSocket at ${url}`);
        this.connectionState = 'connecting';
        this.updateUI();

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          debugLogger.info('WebSocket connected');
          this.connectionState = 'connected';
          this.updateUI();
          this.logMessage('system', 'Connected to WebSocket server');
          resolve(true);
        };

        this.ws.onclose = (event) => {
          debugLogger.info(`WebSocket disconnected: ${event.code} - ${event.reason || 'No reason'}`);
          this.connectionState = 'disconnected';
          this.updateUI();
          this.logMessage('system', `Disconnected: ${event.code} - ${event.reason || 'No reason'}`);
          resolve(false);
        };

        this.ws.onerror = (error) => {
          debugLogger.error('WebSocket error', error);
          this.connectionState = 'error';
          this.updateUI();
          this.logMessage('error', `Error: ${error}`);
          resolve(false);
        };

        this.ws.onmessage = (event) => {
          let data = event.data;
          try {
            // Try to parse as JSON
            data = JSON.parse(data);
            debugLogger.debug('Received message', data);
            this.logMessage('received', data);
          } catch (error) {
            // Not JSON, use as is
            debugLogger.debug('Received raw message', data);
            this.logMessage('received', data);
          }
        };
      } catch (error) {
        debugLogger.error('Error creating WebSocket', error);
        this.connectionState = 'error';
        this.updateUI();
        this.logMessage('error', `Error: ${error.message}`);
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.ws) {
      debugLogger.info('Disconnecting from WebSocket');
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
  }

  /**
   * Send a message to the WebSocket server
   * @param {any} message - Message to send
   * @returns {boolean} - Whether the message was sent
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      debugLogger.error('Cannot send message: WebSocket not connected');
      this.logMessage('error', 'Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(messageStr);
      debugLogger.debug('Sent message', message);
      this.logMessage('sent', message);
      return true;
    } catch (error) {
      debugLogger.error('Error sending message', error);
      this.logMessage('error', `Error sending message: ${error.message}`);
      return false;
    }
  }

  /**
   * Log a message
   * @param {string} type - Message type ('system', 'sent', 'received', 'error')
   * @param {any} message - Message content
   */
  logMessage(type, message) {
    const logEntry = {
      type,
      message,
      timestamp: new Date().toISOString()
    };

    this.messageLog.push(logEntry);

    // Trim log if needed
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog = this.messageLog.slice(-this.maxLogSize);
    }

    this.updateMessageLog();
  }

  /**
   * Update the UI based on connection state
   */
  updateUI() {
    const statusElement = document.getElementById('ws-test-status');
    const connectButton = document.getElementById('ws-test-connect');
    const disconnectButton = document.getElementById('ws-test-disconnect');
    const sendButton = document.getElementById('ws-test-send');

    if (!statusElement || !connectButton || !disconnectButton || !sendButton) {
      return;
    }

    // Update status display
    statusElement.textContent = this.connectionState.charAt(0).toUpperCase() + this.connectionState.slice(1);
    statusElement.className = `status-text ${this.connectionState}`;

    // Update buttons
    connectButton.disabled = this.connectionState === 'connected' || this.connectionState === 'connecting';
    disconnectButton.disabled = this.connectionState !== 'connected';
    sendButton.disabled = this.connectionState !== 'connected';
  }

  /**
   * Update the message log display
   */
  updateMessageLog() {
    const logElement = document.getElementById('ws-test-log');
    if (!logElement) {
      return;
    }

    // Clear log
    logElement.innerHTML = '';

    // Add messages
    for (const entry of this.messageLog) {
      const messageElement = document.createElement('div');
      messageElement.className = `log-entry ${entry.type}`;

      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = new Date(entry.timestamp).toLocaleTimeString();

      const content = document.createElement('span');
      content.className = 'log-content';

      if (typeof entry.message === 'object') {
        content.textContent = JSON.stringify(entry.message, null, 2);
      } else {
        content.textContent = entry.message;
      }

      messageElement.appendChild(timestamp);
      messageElement.appendChild(content);
      logElement.appendChild(messageElement);
    }

    // Scroll to bottom
    logElement.scrollTop = logElement.scrollHeight;
  }

  /**
   * Clear the message log
   */
  clearLog() {
    this.messageLog = [];
    this.updateMessageLog();
  }
}

// Create WebSocket tester instance
const webSocketTester = new WebSocketTester();

// Initialize debug tools when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get UI elements
  const debugContainer = document.getElementById('debug-container');
  if (!debugContainer) {
    return;
  }

  // Initialize WebSocket tester UI
  initializeWebSocketTester();

  // Initialize tab switching
  initializeTabs();

  // Initialize logs viewer
  initializeLogsViewer();

  // Initialize debug settings
  initializeDebugSettings();

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
function initializeWebSocketTester() {
  // Get UI elements
  const wsTestUrl = document.getElementById('ws-test-url');
  const wsTestConnect = document.getElementById('ws-test-connect');
  const wsTestDisconnect = document.getElementById('ws-test-disconnect');
  const wsTestMessage = document.getElementById('ws-test-message');
  const wsTestSend = document.getElementById('ws-test-send');
  const wsTestClear = document.getElementById('ws-test-clear');

  if (!wsTestUrl || !wsTestConnect || !wsTestDisconnect || !wsTestMessage || !wsTestSend || !wsTestClear) {
    return;
  }

  // Set default URL
  chrome.storage.local.get('settings', (data) => {
    if (data.settings) {
      const { wsProtocol, wsHost, wsPort } = data.settings;
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
function initializeTabs() {
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

/**
 * Initialize logs viewer
 */
function initializeLogsViewer() {
  // Get UI elements
  const refreshButton = document.getElementById('refresh-logs');
  const clearButton = document.getElementById('clear-logs');
  const exportButton = document.getElementById('export-logs');
  const levelFilter = document.getElementById('log-level-filter');
  const searchInput = document.getElementById('log-search');
  const searchButton = document.getElementById('log-search-button');

  if (!refreshButton || !clearButton || !exportButton || !levelFilter || !searchInput || !searchButton) {
    debugLogger.error('Failed to find logs viewer UI elements');
    return;
  }

  // Add event listeners
  refreshButton.addEventListener('click', refreshLogs);
  clearButton.addEventListener('click', clearLogs);
  exportButton.addEventListener('click', exportLogs);
  levelFilter.addEventListener('change', () => refreshLogs());
  searchButton.addEventListener('click', () => refreshLogs());
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      refreshLogs();
    }
  });

  // Initial refresh
  refreshLogs();
}

/**
 * Refresh logs
 */
function refreshLogs() {
  const logLevelFilter = document.getElementById('log-level-filter').value;
  const searchTerm = document.getElementById('log-search').value.toLowerCase();

  chrome.storage.local.get(null, (data) => {
    const logKeys = Object.keys(data).filter(key => key.startsWith('logs_'));
    const logs = [];

    for (const key of logKeys) {
      const logEntries = data[key];
      logs.push(...logEntries);
    }

    // Sort by timestamp
    logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Filter by level
    const filteredLogs = logLevelFilter === 'all'
      ? logs
      : logs.filter(log => log.level === logLevelFilter);

    // Filter by search term
    const searchFilteredLogs = searchTerm
      ? filteredLogs.filter(log => {
          const message = typeof log.message === 'string'
            ? log.message.toLowerCase()
            : JSON.stringify(log.message).toLowerCase();
          return message.includes(searchTerm);
        })
      : filteredLogs;

    // Display logs
    const logsContainer = document.getElementById('extension-logs');
    logsContainer.innerHTML = '';

    for (const log of searchFilteredLogs) {
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${log.level}`;

      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = new Date(log.timestamp).toLocaleString();

      const level = document.createElement('span');
      level.className = `log-level ${log.level}`;
      level.textContent = log.level.toUpperCase();

      const name = document.createElement('span');
      name.className = 'log-name';
      name.textContent = `[${log.name}]`;

      const content = document.createElement('span');
      content.className = 'log-content';

      if (typeof log.message === 'object') {
        content.textContent = JSON.stringify(log.message, null, 2);
      } else {
        content.textContent = log.message;
      }

      if (log.data) {
        const data = document.createElement('pre');
        data.className = 'log-data';
        data.textContent = JSON.stringify(log.data, null, 2);
        content.appendChild(data);
      }

      logEntry.appendChild(timestamp);
      logEntry.appendChild(level);
      logEntry.appendChild(name);
      logEntry.appendChild(content);
      logsContainer.appendChild(logEntry);
    }

    // Scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;
  });
}

/**
 * Clear logs
 */
function clearLogs() {
  if (confirm('Are you sure you want to clear all logs?')) {
    chrome.storage.local.get(null, (data) => {
      const logKeys = Object.keys(data).filter(key => key.startsWith('logs_'));

      chrome.storage.local.remove(logKeys, () => {
        document.getElementById('extension-logs').innerHTML = '';
        alert('Logs cleared');
      });
    });
  }
}

/**
 * Export logs
 */
function exportLogs() {
  chrome.storage.local.get(null, (data) => {
    const logKeys = Object.keys(data).filter(key => key.startsWith('logs_'));
    const logs = {};

    for (const key of logKeys) {
      logs[key] = data[key];
    }

    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-new-fuse-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/**
 * Initialize debug settings
 */
function initializeDebugSettings() {
  // Load debug settings
  chrome.storage.local.get('debugSettings', (data) => {
    if (data.debugSettings) {
      document.getElementById('debug-mode').checked = data.debugSettings.debugMode || false;
      document.getElementById('verbose-logging').checked = data.debugSettings.verboseLogging || false;
      document.getElementById('log-to-console').checked = data.debugSettings.logToConsole !== false;
      document.getElementById('log-to-storage').checked = data.debugSettings.logToStorage !== false;
      document.getElementById('max-log-size').value = data.debugSettings.maxLogSize || 1000;
    }
  });

  // Save debug settings
  document.getElementById('save-debug-settings').addEventListener('click', () => {
    const debugSettings = {
      debugMode: document.getElementById('debug-mode').checked,
      verboseLogging: document.getElementById('verbose-logging').checked,
      logToConsole: document.getElementById('log-to-console').checked,
      logToStorage: document.getElementById('log-to-storage').checked,
      maxLogSize: parseInt(document.getElementById('max-log-size').value, 10)
    };

    chrome.storage.local.set({ debugSettings }, () => {
      alert('Debug settings saved');
    });
  });

  // Reset debug settings
  document.getElementById('reset-debug-settings').addEventListener('click', () => {
    const defaultSettings = {
      debugMode: false,
      verboseLogging: false,
      logToConsole: true,
      logToStorage: true,
      maxLogSize: 1000
    };

    document.getElementById('debug-mode').checked = defaultSettings.debugMode;
    document.getElementById('verbose-logging').checked = defaultSettings.verboseLogging;
    document.getElementById('log-to-console').checked = defaultSettings.logToConsole;
    document.getElementById('log-to-storage').checked = defaultSettings.logToStorage;
    document.getElementById('max-log-size').value = defaultSettings.maxLogSize;

    chrome.storage.local.set({ debugSettings: defaultSettings }, () => {
      alert('Debug settings reset to defaults');
    });
  });

  // Copy debug info
  document.getElementById('copy-debug-info').addEventListener('click', () => {
    const debugInfo = {
      version: '1.0.0',
      chromeVersion: navigator.userAgent.match(/Chrome\/([0-9.]+)/)[1],
      platform: navigator.platform,
      extensionId: chrome.runtime.id,
      userAgent: navigator.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => {
        alert('Debug info copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy debug info:', err);
        alert('Failed to copy debug info');
      });
  });
}

// Export for global access
window.WebSocketTester = WebSocketTester;
window.webSocketTester = webSocketTester;
