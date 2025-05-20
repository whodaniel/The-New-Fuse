/**
 * Server Management Tab
 * 
 * This module provides the UI functionality for managing the WebSocket server
 * from the browser extension popup.
 */
import { WebSocketServerStatus, RedisConfig } from '../types.js';
import { Logger } from '../utils/logger.js';

// Create a server-management-specific logger
const serverLogger = new Logger({
  name: 'ServerManagement',
  level: 'info',
  saveToStorage: true
});

// Server status container
let serverStatus: WebSocketServerStatus = {
  isRunning: false,
  port: 0,
  connectedClients: 0,
  message: 'Server not running'
};

// Redis configuration
let redisConfig: RedisConfig = {
  env: 'development',
  host: 'localhost',
  port: 6379,
  username: '',
  password: '',
  tls: false
};

// DOM elements
let serverTab: HTMLElement | null = null;
let serverStatusElement: HTMLElement | null = null;
let serverControlsElement: HTMLElement | null = null;
let startServerButton: HTMLButtonElement | null = null;
let stopServerButton: HTMLButtonElement | null = null;
let serverStatusIndicator: HTMLElement | null = null;
let redisConfigForm: HTMLFormElement | null = null;
let redisTestButton: HTMLButtonElement | null = null;
let redisEnvSelector: HTMLSelectElement | null = null;
let redisCustomConfig: HTMLDivElement | null = null;

/**
 * Initialize the server management tab
 */
function initialize() {
  serverLogger.info('Initializing server management');
  
  // Load settings from storage
  chrome.storage.local.get('settings', (data) => {
    if (data.settings?.redisConfig) {
      redisConfig = { ...redisConfig, ...data.settings.redisConfig };
    }
    
    // Set up UI after settings loaded
    setupUI();
    
    // Get initial server status
    getServerStatus();
    
    // Listen for server status updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'wsServerStatus' && message.data) {
        updateServerStatusUI(message.data);
      }
    });
  });
}

/**
 * Set up the server management UI
 */
function setupUI() {
  // Create server management tab if it doesn't exist
  serverTab = document.querySelector('#server-tab');
  if (!serverTab) {
    serverTab = createServerTab();
  }
  
  // Get references to UI elements
  serverStatusElement = document.getElementById('server-status-text');
  serverControlsElement = document.querySelector('.server-controls');
  startServerButton = document.getElementById('start-server-button') as HTMLButtonElement;
  stopServerButton = document.getElementById('stop-server-button') as HTMLButtonElement;
  serverStatusIndicator = document.getElementById('server-status-icon');
  redisConfigForm = document.getElementById('redis-config-form') as HTMLFormElement;
  redisTestButton = document.getElementById('test-redis') as HTMLButtonElement;
  redisEnvSelector = document.getElementById('redis-env') as HTMLSelectElement;
  redisCustomConfig = document.getElementById('redis-custom-config') as HTMLDivElement;
  
  // Set up event listeners
  if (startServerButton) {
    startServerButton.addEventListener('click', startServer);
  }
  
  if (stopServerButton) {
    stopServerButton.addEventListener('click', stopServer);
  }
  
  if (redisTestButton) {
    redisTestButton.addEventListener('click', testRedisConnection);
  }
  
  if (redisEnvSelector) {
    redisEnvSelector.addEventListener('change', toggleCustomRedisConfig);
    // Set initial value
    redisEnvSelector.value = redisConfig.env;
    toggleCustomRedisConfig();
  }
  
  if (redisConfigForm) {
    // Populate form with saved config
    populateRedisForm();
    redisConfigForm.addEventListener('change', updateRedisConfigFromForm);
  }
  
  // Update UI with initial state
  updateServerControlsUI();
}

/**
 * Create the server management tab
 */
function createServerTab(): HTMLElement {
  const tabsContainer = document.querySelector('.tab-nav');
  if (!tabsContainer) {
    serverLogger.error('Tabs container not found');
    // Return the existing server-tab if available, or create a new one
    return document.getElementById('server-tab') || document.createElement('div');
  }
  
  // Create tab button
  const tabButton = document.createElement('button');
  tabButton.id = 'server-tab-button';
  tabButton.className = 'tab-button';
  tabButton.textContent = 'Server';
  tabButton.dataset.tab = 'server-tab';
  
  // Add tab button to tabs container
  const lastTabButton = tabsContainer.querySelector('.tab-button:last-child');
  if (lastTabButton) {
    tabsContainer.insertBefore(tabButton, lastTabButton.nextSibling);
  } else {
    tabsContainer.appendChild(tabButton);
  }
  
  // Create tab content
  const tabContent = document.createElement('div');
  tabContent.id = 'server-tab';
  tabContent.className = 'tab-content';
  
  // Create tab HTML content
  tabContent.innerHTML = `
    <h2>WebSocket Server</h2>
    
    <div id="server-status" class="status-container">
      <div class="status-row">
        <span>Status:</span>
        <span id="server-status-indicator" class="status-indicator offline">Not running</span>
      </div>
      <div class="status-details" id="server-status-details"></div>
    </div>
    
    <div id="server-controls" class="control-section">
      <button id="start-server" class="primary-button">Start Server</button>
      <button id="stop-server" class="secondary-button" disabled>Stop Server</button>
    </div>
    
    <h3>Redis Configuration</h3>
    
    <form id="redis-config-form" class="config-form">
      <div class="form-group">
        <label for="redis-env">Environment:</label>
        <select id="redis-env" name="env">
          <option value="development">Development</option>
          <option value="production">Production</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      <div id="redis-custom-config" class="hidden">
        <div class="form-group">
          <label for="redis-host">Host:</label>
          <input type="text" id="redis-host" name="host" value="localhost" />
        </div>
        
        <div class="form-group">
          <label for="redis-port">Port:</label>
          <input type="number" id="redis-port" name="port" value="6379" />
        </div>
        
        <div class="form-group">
          <label for="redis-username">Username:</label>
          <input type="text" id="redis-username" name="username" value="" />
        </div>
        
        <div class="form-group">
          <label for="redis-password">Password:</label>
          <input type="password" id="redis-password" name="password" value="" />
        </div>
        
        <div class="form-group checkbox">
          <input type="checkbox" id="redis-tls" name="tls" />
          <label for="redis-tls">Use TLS</label>
        </div>
      </div>
      
      <button type="button" id="test-redis" class="secondary-button">Test Connection</button>
    </form>
  `;
  
  // Add tab content to page
  const tabsContentContainer = document.querySelector('.tab-contents');
  if (tabsContentContainer) {
    tabsContentContainer.appendChild(tabContent);
  } else {
    document.body.appendChild(tabContent);
  }
  
  // Register tab click event
  tabButton.addEventListener('click', () => {
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    tabButton.classList.add('active');
    
    // Show this tab, hide others
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    tabContent.classList.add('active');
  });
  
  return tabContent;
}

/**
 * Start the WebSocket server
 */
function startServer() {
  if (startServerButton) {
    startServerButton.disabled = true;
  }
  
  // Update UI to show server is starting
  if (serverStatusIndicator) {
    serverStatusIndicator.className = 'status-indicator pending';
    serverStatusIndicator.textContent = 'Starting...';
  }
  
  // Get current Redis config from form
  updateRedisConfigFromForm();
  
  // Send message to background script to start server
  chrome.runtime.sendMessage({
    type: 'START_WEBSOCKET_SERVER',
    redisConfig: redisConfig
  }, (response) => {
    if (chrome.runtime.lastError) {
      serverLogger.error('Error sending start server message:', chrome.runtime.lastError);
      showError('Failed to communicate with background script');
      return;
    }
    
    if (!response.success) {
      showError(response.error || 'Failed to start server');
    }
    
    // Status will be updated via onMessage listener
    
    // Re-enable button
    if (startServerButton) {
      startServerButton.disabled = false;
    }
  });
}

/**
 * Stop the WebSocket server
 */
function stopServer() {
  if (stopServerButton) {
    stopServerButton.disabled = true;
  }
  
  // Update UI to show server is stopping
  if (serverStatusIndicator) {
    serverStatusIndicator.className = 'status-indicator pending';
    serverStatusIndicator.textContent = 'Stopping...';
  }
  
  // Send message to background script to stop server
  chrome.runtime.sendMessage({
    type: 'STOP_WEBSOCKET_SERVER'
  }, (response) => {
    if (chrome.runtime.lastError) {
      serverLogger.error('Error sending stop server message:', chrome.runtime.lastError);
      showError('Failed to communicate with background script');
      return;
    }
    
    if (!response.success) {
      showError(response.error || 'Failed to stop server');
    }
    
    // Status will be updated via onMessage listener
    
    // Re-enable button
    if (stopServerButton) {
      stopServerButton.disabled = false;
    }
  });
}

/**
 * Test Redis connection
 */
function testRedisConnection() {
  if (redisTestButton) {
    redisTestButton.disabled = true;
    redisTestButton.textContent = 'Testing...';
  }
  
  // Get current Redis config from form
  updateRedisConfigFromForm();
  
  // Send message to background script to test connection
  chrome.runtime.sendMessage({
    type: 'TEST_REDIS_CONNECTION',
    config: redisConfig
  }, (response) => {
    if (chrome.runtime.lastError) {
      serverLogger.error('Error sending test Redis message:', chrome.runtime.lastError);
      showNotification('Failed to communicate with background script', true);
      return;
    }
    
    if (response.success) {
      showNotification('Redis connection successful', false);
    } else {
      showNotification(response.message || 'Failed to connect to Redis', true);
    }
    
    // Re-enable button
    if (redisTestButton) {
      redisTestButton.disabled = false;
      redisTestButton.textContent = 'Test Connection';
    }
  });
}

/**
 * Get current server status
 */
function getServerStatus() {
  chrome.runtime.sendMessage({
    type: 'GET_SERVER_STATUS'
  }, (response) => {
    if (chrome.runtime.lastError) {
      serverLogger.error('Error getting server status:', chrome.runtime.lastError);
      return;
    }
    
    if (response.status) {
      updateServerStatusUI(response.status);
    }
  });
}

/**
 * Toggle custom Redis configuration visibility based on environment selection
 */
function toggleCustomRedisConfig() {
  if (!redisEnvSelector || !redisCustomConfig) return;
  
  const selectedEnv = redisEnvSelector.value;
  
  if (selectedEnv === 'custom') {
    redisCustomConfig.classList.remove('hidden');
  } else {
    redisCustomConfig.classList.add('hidden');
  }
  
  // Update Redis config
  redisConfig.env = selectedEnv as 'development' | 'production' | 'custom';
  
  // Save to settings
  saveRedisConfig();
}

/**
 * Update Redis configuration from form values
 */
function updateRedisConfigFromForm() {
  if (!redisConfigForm) return;
  
  // Get form values
  const formData = new FormData(redisConfigForm);
  
  // Update Redis config
  redisConfig.env = formData.get('env') as 'development' | 'production' | 'custom';
  redisConfig.host = formData.get('host') as string || 'localhost';
  redisConfig.port = parseInt(formData.get('port') as string || '6379');
  redisConfig.username = formData.get('username') as string || '';
  redisConfig.password = formData.get('password') as string || '';
  redisConfig.tls = formData.get('tls') === 'on';
  
  // Save to settings
  saveRedisConfig();
}

/**
 * Populate Redis form with saved config
 */
function populateRedisForm() {
  if (!redisConfigForm) return;
  
  // Set form values
  const envField = redisConfigForm.querySelector('#redis-env') as HTMLSelectElement;
  const hostField = redisConfigForm.querySelector('#redis-host') as HTMLInputElement;
  const portField = redisConfigForm.querySelector('#redis-port') as HTMLInputElement;
  const usernameField = redisConfigForm.querySelector('#redis-username') as HTMLInputElement;
  const passwordField = redisConfigForm.querySelector('#redis-password') as HTMLInputElement;
  const tlsField = redisConfigForm.querySelector('#redis-tls') as HTMLInputElement;
  
  if (envField) envField.value = redisConfig.env;
  if (hostField && redisConfig.host !== undefined) hostField.value = redisConfig.host;
  if (portField && redisConfig.port !== undefined) portField.value = redisConfig.port.toString();
  if (usernameField && redisConfig.username !== undefined) usernameField.value = redisConfig.username;
  if (passwordField && redisConfig.password !== undefined) passwordField.value = redisConfig.password;
  if (tlsField && redisConfig.tls !== undefined) tlsField.checked = redisConfig.tls;
}

/**
 * Save Redis configuration to settings
 */
function saveRedisConfig() {
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings || {};
    
    // Update Redis config in settings
    settings.redisConfig = redisConfig;
    
    // Save to storage
    chrome.storage.local.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        serverLogger.error('Error saving Redis config:', chrome.runtime.lastError);
      }
    });
  });
}

/**
 * Update server status UI
 */
function updateServerStatusUI(status: WebSocketServerStatus) {
  // Update internal status
  serverStatus = status;
  
  // Update UI
  if (serverStatusIndicator) {
    const statusClass = status.isRunning ? 'online' : status.error ? 'error' : 'offline';
    serverStatusIndicator.className = `status-indicator ${statusClass}`;
    serverStatusIndicator.textContent = status.message;
  }
  
  // Update status details
  const statusDetails = document.getElementById('server-status-details');
  if (statusDetails) {
    let detailsHTML = '';
    
    if (status.isRunning) {
      detailsHTML += `<div>Port: ${status.port || 'Unknown'}</div>`;
      
      if (typeof status.uptime === 'number') {
        const minutes = Math.floor(status.uptime / 60);
        const seconds = status.uptime % 60;
        detailsHTML += `<div>Uptime: ${minutes}m ${seconds}s</div>`;
      }
      
      if (typeof status.connectedClients === 'number') {
        detailsHTML += `<div>Connected clients: ${status.connectedClients}</div>`;
      }
    } else if (status.error) {
      detailsHTML += `<div class="error-message">${status.error}</div>`;
    }
    
    statusDetails.innerHTML = detailsHTML;
  }
  
  // Update server controls
  updateServerControlsUI();
}

/**
 * Update server controls UI based on current status
 */
function updateServerControlsUI() {
  if (startServerButton) {
    startServerButton.disabled = serverStatus.isRunning;
  }
  
  if (stopServerButton) {
    stopServerButton.disabled = !serverStatus.isRunning;
  }
}

/**
 * Show a notification
 */
function showNotification(message: string, isError: boolean = false) {
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;
  
  // Add to notifications container or body
  const container = document.querySelector('.notifications') || document.body;
  container.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

/**
 * Show an error message in the server status section
 */
function showError(message: string) {
  const errorStatus: WebSocketServerStatus = {
    isRunning: false,
    port: 0,
    connectedClients: 0,
    message: 'Error',
    error: message
  };
  
  updateServerStatusUI(errorStatus);
}

// Export the module
export const serverManagement = {
  initialize
};