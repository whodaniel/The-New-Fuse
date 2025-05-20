/**
 * Options script for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';

// Create an options-specific logger
const optionsLogger = new Logger({
  name: 'Options',
  level: 'info',
  saveToStorage: true
});

// Log startup
optionsLogger.info('Options script loaded');

/**
 * Extension settings
 */
interface ExtensionSettings {
  wsProtocol: string;
  wsHost: string;
  wsPort: number;
  useCompression: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  validateCertificates: boolean;
  enableTokenRefresh: boolean;
  debugMode: boolean;
  logWebSocketTraffic: boolean;
  logLevel: string;
}

/**
 * Default settings
 */
const defaultSettings: ExtensionSettings = {
  wsProtocol: 'ws',
  wsHost: 'localhost',
  wsPort: 3712,
  useCompression: true,
  maxRetryAttempts: 5,
  retryDelay: 1000,
  validateCertificates: true,
  enableTokenRefresh: true,
  debugMode: false,
  logWebSocketTraffic: false,
  logLevel: 'error'
};

/**
 * UI elements
 */
interface UIElements {
  protocol: HTMLSelectElement | null;
  host: HTMLInputElement | null;
  port: HTMLInputElement | null;
  compression: HTMLInputElement | null;
  maxRetries: HTMLInputElement | null;
  retryDelay: HTMLInputElement | null;
  validateCerts: HTMLInputElement | null;
  tokenRefresh: HTMLInputElement | null;
  debugMode: HTMLInputElement | null;
  logTraffic: HTMLInputElement | null;
  logLevel: HTMLSelectElement | null;
  debugSettings: HTMLElement | null;
  saveButton: HTMLButtonElement | null;
  resetButton: HTMLButtonElement | null;
  status: HTMLElement | null;
}

/**
 * Get UI elements
 */
function getElements(): UIElements {
  return {
    protocol: document.getElementById('default-protocol') as HTMLSelectElement,
    host: document.getElementById('default-host') as HTMLInputElement,
    port: document.getElementById('default-port') as HTMLInputElement,
    compression: document.getElementById('use-compression') as HTMLInputElement,
    maxRetries: document.getElementById('max-retry-attempts') as HTMLInputElement,
    retryDelay: document.getElementById('retry-delay') as HTMLInputElement,
    validateCerts: document.getElementById('validate-certificates') as HTMLInputElement,
    tokenRefresh: document.getElementById('enable-token-refresh') as HTMLInputElement,
    debugMode: document.getElementById('debug-mode') as HTMLInputElement,
    logTraffic: document.getElementById('log-websocket-traffic') as HTMLInputElement,
    logLevel: document.getElementById('log-level') as HTMLSelectElement,
    debugSettings: document.getElementById('debug-settings'),
    saveButton: document.getElementById('save') as HTMLButtonElement,
    resetButton: document.getElementById('reset') as HTMLButtonElement,
    status: document.getElementById('status')
  };
}

// Get elements
const elements = getElements();

/**
 * Load settings from storage
 */
function loadSettings(): void {
  chrome.storage.local.get('settings', (data) => {
    const settings: ExtensionSettings = data.settings || defaultSettings;

    // Apply settings to form
    if (elements.protocol) elements.protocol.value = settings.wsProtocol;
    if (elements.host) elements.host.value = settings.wsHost;
    if (elements.port) elements.port.value = settings.wsPort.toString();
    if (elements.compression) elements.compression.checked = settings.useCompression;
    if (elements.maxRetries) elements.maxRetries.value = settings.maxRetryAttempts.toString();
    if (elements.retryDelay) elements.retryDelay.value = settings.retryDelay.toString();
    if (elements.validateCerts) elements.validateCerts.checked = settings.validateCertificates;
    if (elements.tokenRefresh) elements.tokenRefresh.checked = settings.enableTokenRefresh;
    if (elements.debugMode) elements.debugMode.checked = settings.debugMode;
    if (elements.logTraffic) elements.logTraffic.checked = settings.logWebSocketTraffic;
    if (elements.logLevel) elements.logLevel.value = settings.logLevel;

    // Show/hide debug settings
    if (elements.debugSettings) {
      elements.debugSettings.style.display = settings.debugMode ? 'block' : 'none';
    }

    optionsLogger.debug('Settings loaded', settings);
  });
}

/**
 * Save settings to storage
 */
function saveSettings(): void {
  if (!elements.protocol || !elements.host || !elements.port ||
      !elements.compression || !elements.maxRetries || !elements.retryDelay ||
      !elements.validateCerts || !elements.tokenRefresh || !elements.debugMode ||
      !elements.logTraffic || !elements.logLevel) {
    optionsLogger.error('Missing UI elements');
    return;
  }

  const settings: ExtensionSettings = {
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

    optionsLogger.info('Settings saved', settings);
  });
}

/**
 * Reset settings to defaults
 */
function resetSettings(): void {
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

      optionsLogger.info('Settings reset to defaults');
    });
  }
}

/**
 * Validate settings
 * @param settings - Settings to validate
 * @returns Whether settings are valid
 */
function validateSettings(settings: ExtensionSettings): boolean {
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

/**
 * Show status message
 * @param message - Status message
 * @param type - Status type ('success' or 'error')
 */
function showStatus(message: string, type: 'success' | 'error'): void {
  if (!elements.status) return;

  elements.status.textContent = message;
  elements.status.className = `status ${type}`;

  // Clear status after 3 seconds
  setTimeout(() => {
    if (elements.status) {
      elements.status.className = 'status';
    }
  }, 3000);
}

/**
 * Initialize options page
 */
function initialize(): void {
  // Load settings
  loadSettings();

  // Add event listeners
  if (elements.saveButton) {
    elements.saveButton.addEventListener('click', saveSettings);
  }

  if (elements.resetButton) {
    elements.resetButton.addEventListener('click', resetSettings);
  }

  // Toggle debug settings visibility
  if (elements.debugMode && elements.debugSettings) {
    elements.debugMode.addEventListener('change', (e) => {
      if (elements.debugSettings) {
        elements.debugSettings.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none';
      }
    });
  }

  // Form validation
  if (elements.port) {
    elements.port.addEventListener('input', () => {
      const port = parseInt(elements.port?.value || '0', 10);
      if (port < 1 || port > 65535) {
        elements.port?.setCustomValidity('Port must be between 1 and 65535');
      } else {
        elements.port?.setCustomValidity('');
      }
    });
  }

  if (elements.maxRetries) {
    elements.maxRetries.addEventListener('input', () => {
      const retries = parseInt(elements.maxRetries?.value || '0', 10);
      if (retries < 0) {
        elements.maxRetries?.setCustomValidity('Cannot be negative');
      } else {
        elements.maxRetries?.setCustomValidity('');
      }
    });
  }

  if (elements.retryDelay) {
    elements.retryDelay.addEventListener('input', () => {
      const delay = parseInt(elements.retryDelay?.value || '0', 10);
      if (delay < 100) {
        elements.retryDelay?.setCustomValidity('Must be at least 100ms');
      } else {
        elements.retryDelay?.setCustomValidity('');
      }
    });
  }

  // Listen for settings changes from other parts of the extension
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      loadSettings();
    }
  });

  optionsLogger.info('Options page initialized');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
