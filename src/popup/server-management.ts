/**
 * Server Management Module
 * 
 * Handles WebSocket server management functionality in the popup UI
 */

interface ServerSettings {
  autoStart: boolean;
  port: number;
  saveLogsToFile: boolean;
  logPath: string;
}

/**
 * Default server settings
 */
const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  autoStart: false,
  port: 3712,
  saveLogsToFile: false,
  logPath: ''
};

/**
 * Initialize the server management tab
 */
export function initializeServerManagement() {
  const serverTab = document.getElementById('server-tab');
  if (!serverTab) return;
  
  // Replace placeholder content with actual UI
  serverTab.innerHTML = `
    <h3>WebSocket Server Management</h3>
    
    <div class="server-status-section">
      <div class="status-row">
        <span>Server Status:</span>
        <span id="server-status" class="status-indicator">Stopped</span>
      </div>
      <div class="status-row">
        <span>Port:</span>
        <span id="server-port">3712</span>
      </div>
      <div class="status-row">
        <span>Connected Clients:</span>
        <span id="connected-clients">0</span>
      </div>
    </div>
    
    <div class="server-controls">
      <button id="start-server-btn" class="primary-button">Start Server</button>
      <button id="stop-server-btn" class="primary-button" disabled>Stop Server</button>
      <button id="restart-server-btn" class="secondary-button" disabled>Restart</button>
    </div>
    
    <div class="server-settings">
      <h3>Server Settings</h3>
      <form id="server-settings-form">
        <div class="form-group checkbox">
          <input type="checkbox" id="auto-start-server" />
          <label for="auto-start-server">Auto-start server on extension load</label>
        </div>
        
        <div class="form-group">
          <label for="server-port-input">Server Port:</label>
          <input type="number" id="server-port-input" value="3712" min="1024" max="65535" />
        </div>
        
        <div class="form-group checkbox">
          <input type="checkbox" id="save-logs" />
          <label for="save-logs">Save server logs to file</label>
        </div>
        
        <div class="form-group">
          <label for="log-path">Log File Path:</label>
          <input type="text" id="log-path" placeholder="logs/server.log" />
          <button type="button" id="browse-logs-btn" class="secondary-button small">Browse</button>
        </div>
        
        <button type="button" id="save-server-settings" class="primary-button">Save Settings</button>
      </form>
    </div>
    
    <div class="server-logs">
      <h3>Server Logs</h3>
      <div class="log-actions">
        <button id="clear-logs-btn" class="secondary-button small">Clear</button>
        <button id="export-logs-btn" class="secondary-button small">Export</button>
      </div>
      <div id="log-container" class="log-container">
        <pre id="server-logs">No logs available</pre>
      </div>
    </div>
  `;
  
  // Initialize event listeners
  initEventListeners();
  loadSettings();
}

/**
 * Initialize event listeners for server management
 */
function initEventListeners() {
  const startBtn = document.getElementById('start-server-btn');
  const stopBtn = document.getElementById('stop-server-btn');
  const restartBtn = document.getElementById('restart-server-btn');
  const saveSettingsBtn = document.getElementById('save-server-settings');
  
  startBtn?.addEventListener('click', startServer);
  stopBtn?.addEventListener('click', stopServer);
  restartBtn?.addEventListener('click', restartServer);
  saveSettingsBtn?.addEventListener('click', saveSettings);
  
  // Add event listener for log controls
  document.getElementById('clear-logs-btn')?.addEventListener('click', clearLogs);
  document.getElementById('export-logs-btn')?.addEventListener('click', exportLogs);
}

/**
 * Load server settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('serverSettings');
    const settings: ServerSettings = result.serverSettings || DEFAULT_SERVER_SETTINGS;
    
    // Apply settings to UI
    const autoStartCheckbox = document.getElementById('auto-start-server') as HTMLInputElement;
    const portInput = document.getElementById('server-port-input') as HTMLInputElement;
    const saveLogsCheckbox = document.getElementById('save-logs') as HTMLInputElement;
    const logPathInput = document.getElementById('log-path') as HTMLInputElement;
    
    if (autoStartCheckbox) autoStartCheckbox.checked = settings.autoStart;
    if (portInput) portInput.value = settings.port.toString();
    if (saveLogsCheckbox) saveLogsCheckbox.checked = settings.saveLogsToFile;
    if (logPathInput) logPathInput.value = settings.logPath;
  } catch (error) {
    console.error('Failed to load server settings:', error);
  }
}

/**
 * Save server settings to storage
 */
async function saveSettings() {
  const autoStartCheckbox = document.getElementById('auto-start-server') as HTMLInputElement;
  const portInput = document.getElementById('server-port-input') as HTMLInputElement;
  const saveLogsCheckbox = document.getElementById('save-logs') as HTMLInputElement;
  const logPathInput = document.getElementById('log-path') as HTMLInputElement;
  
  const settings: ServerSettings = {
    autoStart: autoStartCheckbox?.checked || false,
    port: parseInt(portInput?.value || '3712'),
    saveLogsToFile: saveLogsCheckbox?.checked || false,
    logPath: logPathInput?.value || ''
  };
  
  try {
    await chrome.storage.local.set({ serverSettings: settings });
    showNotification('Server settings saved successfully');
  } catch (error) {
    console.error('Failed to save server settings:', error);
    showNotification('Failed to save server settings', 'error');
  }
}

/**
 * Start the WebSocket server
 */
function startServer() {
  const portInput = document.getElementById('server-port-input') as HTMLInputElement;
  const port = parseInt(portInput?.value || '3712');
  
  chrome.runtime.sendMessage({ type: 'START_WS_SERVER', port }, (response) => {
    if (response && response.success) {
      updateServerStatus('Running');
      updateButtonStates(true);
      addLogEntry(`Server started on port ${port}`);
    } else {
      showNotification(`Failed to start server: ${response?.error || 'Unknown error'}`, 'error');
      addLogEntry(`Failed to start server: ${response?.error || 'Unknown error'}`);
    }
  });
}

/**
 * Stop the WebSocket server
 */
function stopServer() {
  chrome.runtime.sendMessage({ type: 'STOP_WS_SERVER' }, (response) => {
    if (response && response.success) {
      updateServerStatus('Stopped');
      updateButtonStates(false);
      addLogEntry('Server stopped');
    } else {
      showNotification(`Failed to stop server: ${response?.error || 'Unknown error'}`, 'error');
      addLogEntry(`Failed to stop server: ${response?.error || 'Unknown error'}`);
    }
  });
}

/**
 * Restart the WebSocket server
 */
function restartServer() {
  chrome.runtime.sendMessage({ type: 'RESTART_WS_SERVER' }, (response) => {
    if (response && response.success) {
      updateServerStatus('Running');
      updateButtonStates(true);
      addLogEntry('Server restarted');
    } else {
      showNotification(`Failed to restart server: ${response?.error || 'Unknown error'}`, 'error');
      addLogEntry(`Failed to restart server: ${response?.error || 'Unknown error'}`);
    }
  });
}

/**
 * Update server status indicator
 */
function updateServerStatus(status: string) {
  const statusIndicator = document.getElementById('server-status');
  if (statusIndicator) {
    statusIndicator.textContent = status;
    statusIndicator.className = `status-indicator ${status.toLowerCase()}`;
  }
}

/**
 * Update button states based on server status
 */
function updateButtonStates(isRunning: boolean) {
  const startBtn = document.getElementById('start-server-btn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stop-server-btn') as HTMLButtonElement;
  const restartBtn = document.getElementById('restart-server-btn') as HTMLButtonElement;
  
  if (startBtn) startBtn.disabled = isRunning;
  if (stopBtn) stopBtn.disabled = !isRunning;
  if (restartBtn) restartBtn.disabled = !isRunning;
}

/**
 * Add entry to server logs
 */
function addLogEntry(message: string) {
  const logs = document.getElementById('server-logs');
  if (logs) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}`;
    logs.textContent = `${entry}\n${logs.textContent}`;
  }
}

/**
 * Clear server logs
 */
function clearLogs() {
  const logs = document.getElementById('server-logs');
  if (logs) {
    logs.textContent = 'Logs cleared';
  }
}

/**
 * Export server logs
 */
function exportLogs() {
  const logs = document.getElementById('server-logs');
  if (logs && logs.textContent) {
    const blob = new Blob([logs.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `server_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

/**
 * Show notification
 */
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  const notifications = document.querySelector('.notifications');
  if (notifications) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notifications.removeChild(notification), 500);
    }, 5000);
  }
}

// Initialize when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  initializeServerManagement();
});