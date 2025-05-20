// Default settings
const defaultSettings = {
  wsProtocol: 'ws',
  wsHost: 'localhost',
  wsPort: 3712, // Updated to match background.js and popup.js
  useCompression: true,
  maxRetryAttempts: 5,
  retryDelay: 1000,
  validateCertificates: true,
  enableTokenRefresh: true,
  debugMode: false,
  logWebSocketTraffic: false,
  logLevel: 'error'
};

// Elements
const elements = {
  protocol: document.getElementById('default-protocol'),
  host: document.getElementById('default-host'),
  port: document.getElementById('default-port'),
  compression: document.getElementById('use-compression'),
  maxRetries: document.getElementById('max-retry-attempts'),
  retryDelay: document.getElementById('retry-delay'),
  validateCerts: document.getElementById('validate-certificates'),
  tokenRefresh: document.getElementById('enable-token-refresh'),
  debugMode: document.getElementById('debug-mode'),
  logTraffic: document.getElementById('log-websocket-traffic'),
  logLevel: document.getElementById('log-level'),
  debugSettings: document.getElementById('debug-settings'),
  saveButton: document.getElementById('save'),
  resetButton: document.getElementById('reset'),
  status: document.getElementById('status')
};

// Load settings
function loadSettings() {
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings || defaultSettings;

    // Apply settings to form
    elements.protocol.value = settings.wsProtocol;
    elements.host.value = settings.wsHost;
    elements.port.value = settings.wsPort;
    elements.compression.checked = settings.useCompression;
    elements.maxRetries.value = settings.maxRetryAttempts;
    elements.retryDelay.value = settings.retryDelay;
    elements.validateCerts.checked = settings.validateCertificates;
    elements.tokenRefresh.checked = settings.enableTokenRefresh;
    elements.debugMode.checked = settings.debugMode;
    elements.logTraffic.checked = settings.logWebSocketTraffic;
    elements.logLevel.value = settings.logLevel;

    // Show/hide debug settings
    elements.debugSettings.style.display = settings.debugMode ? 'block' : 'none';
  });
}

// Save settings
function saveSettings() {
  const settings = {
    wsProtocol: elements.protocol.value,
    wsHost: elements.host.value,
    wsPort: parseInt(elements.port.value, 10),
    useCompression: elements.compression.checked,
    maxRetryAttempts: parseInt(elements.maxRetries.value, 10),
    retryDelay: parseInt(elements.retryDelay.value, 10),
    validateCertificates: elements.validateCerts.checked,
    enableTokenRefresh: elements.tokenRefresh.checked,
    debugMode: elements.debugMode.checked,
    logWebSocketTraffic: elements.logTraffic.checked,
    logLevel: elements.logLevel.value
  };

  // Validate settings
  if (!validateSettings(settings)) {
    return;
  }

  // Save to storage
  chrome.storage.local.set({ settings }, () => {
    showStatus('Settings saved successfully', 'success');

    // Notify background script
    chrome.runtime.sendMessage({
      type: 'updateSettings',
      settings: settings,
      reconnect: true
    });
  });
}

// Reset settings
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.local.set({ settings: defaultSettings }, () => {
      loadSettings();
      showStatus('Settings reset to defaults', 'success');

      // Notify background script
      chrome.runtime.sendMessage({
        type: 'updateSettings',
        settings: defaultSettings,
        reconnect: true
      });
    });
  }
}

// Validate settings
function validateSettings(settings) {
  // Port validation
  if (settings.wsPort < 1 || settings.wsPort > 65535) {
    showStatus('Port must be between 1 and 65535', 'error');
    return false;
  }

  // Host validation
  if (!settings.wsHost) {
    showStatus('Host cannot be empty', 'error');
    return false;
  }

  // Retry attempts validation
  if (settings.maxRetryAttempts < 0) {
    showStatus('Max retry attempts cannot be negative', 'error');
    return false;
  }

  // Retry delay validation
  if (settings.retryDelay < 100) {
    showStatus('Retry delay must be at least 100ms', 'error');
    return false;
  }

  return true;
}

// Show status message
function showStatus(message, type) {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`;

  // Clear status after 3 seconds
  setTimeout(() => {
    elements.status.className = 'status';
  }, 3000);
}

// Event listeners
elements.saveButton.addEventListener('click', saveSettings);
elements.resetButton.addEventListener('click', resetSettings);

// Toggle debug settings visibility
elements.debugMode.addEventListener('change', (e) => {
  elements.debugSettings.style.display = e.target.checked ? 'block' : 'none';
});

// Form validation
elements.port.addEventListener('input', () => {
  const port = parseInt(elements.port.value, 10);
  if (port < 1 || port > 65535) {
    elements.port.setCustomValidity('Port must be between 1 and 65535');
  } else {
    elements.port.setCustomValidity('');
  }
});

elements.maxRetries.addEventListener('input', () => {
  const retries = parseInt(elements.maxRetries.value, 10);
  if (retries < 0) {
    elements.maxRetries.setCustomValidity('Cannot be negative');
  } else {
    elements.maxRetries.setCustomValidity('');
  }
});

elements.retryDelay.addEventListener('input', () => {
  const delay = parseInt(elements.retryDelay.value, 10);
  if (delay < 100) {
    elements.retryDelay.setCustomValidity('Must be at least 100ms');
  } else {
    elements.retryDelay.setCustomValidity('');
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);

// Listen for settings changes from other parts of the extension
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    loadSettings();
  }
});
