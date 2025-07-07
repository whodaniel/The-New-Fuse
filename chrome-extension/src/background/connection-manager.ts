/**
 * Connection manager for The New Fuse - AI Bridge
 */
import { CONFIG } from '../config'; // Adjust path if necessary
import { WebSocketManager } from '../utils/websocket-manager.js';
import { Logger } from '../utils/logger.js';
import { AuthManager } from './auth-manager.js';
import { SecurityManager } from '../utils/security.js';
import { Store } from '../utils/store.js';

// Create a connection-specific logger
const connectionLogger = new Logger({
  name: 'ConnectionManager',
  level: 'info',
  saveToStorage: true
});

/**
 * Connection settings
 */
export interface ConnectionSettings {
  wsProtocol: string;
  wsHost: string;
  wsPort: number;
  useCompression: boolean;
  relayUrl: string;
  autoConnect: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  debugMode: boolean;
}

/**
 * Default connection settings
 */
export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  wsProtocol: CONFIG.WS_PROTOCOL,
  wsHost: CONFIG.WS_HOST,
  wsPort: CONFIG.WS_PORT,
  useCompression: CONFIG.ENABLE_COMPRESSION,
  relayUrl: 'https://localhost:3000', // This setting is not in CONFIG, keep as is for now
  autoConnect: true, // This setting is not in CONFIG, keep as is for now
  maxRetryAttempts: CONFIG.MAX_RETRY_ATTEMPTS,
  retryDelay: CONFIG.RETRY_DELAY,
  debugMode: CONFIG.DEBUG_MODE_DEFAULT, // Use new default from CONFIG
};

/**
 * Connection manager
 */
export class ConnectionManager {
  private wsManager: WebSocketManager | null = null;
  private authManager: AuthManager;
  private securityManager: SecurityManager;
  private store: Store;
  private settings: ConnectionSettings;
  private connectionState: {
    vscode: boolean;
    relay: boolean;
  } = {
    vscode: false,
    relay: false
  };
  private lastEncryptionError: string | null = null;

  /**
   * Create a new ConnectionManager
   * @param settings - Connection settings
   */
  constructor(settings: Partial<ConnectionSettings> = {}) {
    this.settings = { ...DEFAULT_CONNECTION_SETTINGS, ...settings };
    this.authManager = new AuthManager(this.settings.relayUrl);
    this.securityManager = new SecurityManager();
    this.store = Store.getInstance();
    connectionLogger.info('ConnectionManager initialized', this.settings);
  }

  /**
   * Initialize connection
   */
  async initialize(): Promise<void> {
    try {
      // Step 1: Load settings from storage
      await this.loadSettings();
      connectionLogger.info('Settings loaded successfully');

      // Step 2: Initialize auth manager
      await this.authManager.initialize();
      connectionLogger.info('Auth manager initialized successfully');

      // Step 3: Connect if auto-connect is enabled
      if (this.settings.autoConnect) {
        try {
          const connected = await this.connect();
          if (connected) {
            connectionLogger.info('Auto-connect successful');
          } else {
            connectionLogger.warn('Auto-connect attempt failed, will retry later');
          }
        } catch (connectError) {
          // Don't throw the error, just log it - the user can manually connect later
          connectionLogger.error('Error during auto-connect:', connectError);
        }
      }
    } catch (error) {
      connectionLogger.error('Failed to initialize connection manager:', error);
      throw error; // Re-throw so the background script knows initialization failed
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['connectionSettings']);
      if (result.connectionSettings) {
        this.settings = { ...DEFAULT_CONNECTION_SETTINGS, ...result.connectionSettings };
        this.authManager.setRelayUrl(this.settings.relayUrl);
        connectionLogger.info('Loaded connection settings', this.settings);
      }
    } catch (error) {
      connectionLogger.error('Error loading connection settings', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings(settings: Partial<ConnectionSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };

    try {
      await chrome.storage.local.set({ connectionSettings: this.settings });
      this.authManager.setRelayUrl(this.settings.relayUrl);
      connectionLogger.info('Saved connection settings', this.settings);
    } catch (error) {
      connectionLogger.error('Error saving connection settings', error);
    }
  }

  /**
   * Connect to WebSocket server
   * @returns Whether connection was successful
   */
  async connect(): Promise<boolean> {
    try {
      // Check if already connected
      if (this.wsManager && this.wsManager.isConnected()) {
        connectionLogger.info('Already connected to WebSocket server');
        return true;
      }

      // Create WebSocket URL
      const wsUrl = `${this.settings.wsProtocol}://${this.settings.wsHost}:${this.settings.wsPort}`;
      connectionLogger.info(`Connecting to WebSocket server at ${wsUrl}`);

      // Verify server is available before connecting (optional check)
      connectionLogger.info(`Attempting to connect to WebSocket server at: ${wsUrl}`);

      // Create WebSocket manager
      this.wsManager = new WebSocketManager(wsUrl, {
        useCompression: this.settings.useCompression,
        reconnectAttempts: this.settings.maxRetryAttempts,
        reconnectDelay: this.settings.retryDelay,
        debug: this.settings.debugMode, // Use settings.debugMode
        securityManager: this.securityManager
      });

      // Set up event listeners - Changed addEventListener to addListener
      this.wsManager.addListener('open', this.handleOpen.bind(this));
      this.wsManager.addListener('close', this.handleClose.bind(this));
      this.wsManager.addListener('error', this.handleError.bind(this)); // General errors
      this.wsManager.addListener('message', this.handleMessage.bind(this));
      this.wsManager.addListener('encryption_unavailable', this.handleEncryptionUnavailable.bind(this)); // New
      this.wsManager.addListener('encryption_error', this.handleEncryptionError.bind(this)); // New

      // Connect to WebSocket server with timeout
      const connectPromise = this.wsManager.connect();

      // Add timeout for connection attempt
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 5000); // 5 second timeout
      });

      // Race the connection and timeout
      const connected = await Promise.race([connectPromise, timeoutPromise]);

      if (connected) {
        connectionLogger.info('Successfully connected to WebSocket server');
        this.connectionState.vscode = true;
        this.notifyConnectionState();
        return true;
      } else {
        connectionLogger.error('Failed to connect to WebSocket server - timed out or connection failed');
        this.connectionState.vscode = false;
        this.notifyConnectionState();
        return false;
      }
    } catch (error) {
      connectionLogger.error('Exception during WebSocket connection attempt:', error);
      this.connectionState.vscode = false;
      this.notifyConnectionState();
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.wsManager) {
      this.wsManager.disconnect();
      this.wsManager = null;
    }

    this.connectionState.vscode = false;
    this.notifyConnectionState();
    connectionLogger.info('Disconnected from WebSocket server');
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    connectionLogger.info('WebSocket connection opened');
    this.lastEncryptionError = null; // Clear any previous encryption error
    this.connectionState.vscode = true;
    // notifyConnectionState will be called after auth, or if auth is not part of this connection step
    // For now, let's send an initial "connected, authenticating"
    this.notifyConnectionState(); // This will show "Authenticating" or "Connected"
    this.sendAuthMessage();
  }

  /**
   * Handle WebSocket close event
   * @param event - Close event
   */
  private handleClose(event: any): void {
    connectionLogger.info(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.connectionState.vscode = false;
    this.notifyConnectionState();
  }

  /**
   * Handle WebSocket error event
   * @param error - Error event
   */
  private handleError(error: any): void {
    connectionLogger.error('WebSocket error', error);
    this.connectionState.vscode = false;
    this.notifyConnectionState();
  }

  /**
   * Handle WebSocket message event
   * @param data - Message data
   */
  private handleMessage(data: any): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    // Handle specific message types
    switch (data.type) {
      case 'AUTH_RESPONSE':
        this.handleAuthResponse(data);
        break;
      case 'PING':
        this.handlePing(data);
        break;
      default:
        // Forward message to extension
        this.forwardMessage(data);
        break;
    }
  }

  /**
   * Send authentication message
   */
  private sendAuthMessage(): void {
    if (!this.wsManager || !this.wsManager.isConnected()) {
      connectionLogger.warn('Cannot send auth message: WebSocket not connected');
      return;
    }

    const token = this.authManager.getAuthHeader().Authorization?.split(' ')[1];
    if (!token) {
      connectionLogger.warn('Cannot send auth message: No token');
      return;
    }

    this.wsManager.send({
      type: 'AUTH',
      token,
      timestamp: Date.now()
    });

    connectionLogger.info('Sent authentication message');
  }

  /**
   * Handle authentication response
   * @param data - Message data
   */
  private handleAuthResponse(data: any): void {
    if (data.success) {
      connectionLogger.info('Authentication successful');
      this.connectionState.relay = true;
    } else {
      connectionLogger.error('Authentication failed', data.error);
      this.connectionState.relay = false;

      // Try to refresh token and reconnect
      this.authManager.refreshTokens().then(refreshed => {
        if (refreshed) {
          this.sendAuthMessage();
        }
      });
    }

    this.notifyConnectionState();
  }

  /**
   * Handle ping message
   * @param data - Message data
   */
  private handlePing(data: any): void {
    if (!this.wsManager || !this.wsManager.isConnected()) {
      return;
    }

    // Send pong response
    this.wsManager.send({
      type: 'PONG',
      timestamp: Date.now(),
      pingTimestamp: data.timestamp
    });
  }

  /**
   * Forward message to extension
   * @param data - Message data
   */
  private forwardMessage(data: any): void {
    // Send message to all extension pages
    chrome.runtime.sendMessage(data).catch(error => {
      // Ignore errors from disconnected ports
      if (!error.message.includes('Receiving end does not exist')) {
        connectionLogger.error('Error forwarding message', error);
      }
    });
  }

  /**
   * Send message to WebSocket server
   * @param message - Message to send
   * @returns Promise that resolves to whether message was sent
   */
  async sendMessage(message: any): Promise<boolean> {
    if (!this.wsManager || !this.wsManager.isConnected()) {
      connectionLogger.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    return await this.wsManager.send(message);
  }

  /**
   * Notify connection state
   */
  private notifyConnectionState(): void {
    const wsFullStatus = this.wsManager?.getConnectionStatus() || {
      status: 'disconnected',
      message: this.wsManager ? 'WebSocket is not connected.' : 'No WebSocket manager',
      retriesExhausted: false
    };

    let finalStatus: 'connected' | 'disconnected' | 'connecting' | 'error' | 'authenticating' | 'uninitialized' = wsFullStatus.status;
    let finalMessage: string | undefined = wsFullStatus.message;

    // Prioritize encryption errors for the message if one occurred
    if (this.lastEncryptionError) {
      finalStatus = 'error';
      finalMessage = this.lastEncryptionError;
      // Clear the error after reporting so it doesn't stick if a subsequent connection attempt is made
      // Or, only clear it if a connection becomes successful. For now, let's clear it.
      // this.lastEncryptionError = null; // Decide on strategy: clear or let it persist until successful connect
    } else if (this.connectionState.vscode && this.connectionState.relay && finalStatus === 'connected') {
      finalStatus = 'connected';
      finalMessage = 'Successfully connected and authenticated.';
    } else if (this.connectionState.vscode && !this.connectionState.relay && finalStatus !== 'error' && finalStatus !== 'disconnected') {
      finalStatus = 'authenticating';
      finalMessage = wsFullStatus.retriesExhausted ?
                       `Authentication failed. Connection attempts to server exhausted. Please check settings and server status.` :
                       (finalMessage || 'Authenticating with relay server...');
    } else if (wsFullStatus.retriesExhausted) {
      finalStatus = 'error';
      finalMessage = `Connection failed. Max retries reached. Please check server and settings, then try reconnecting manually.`;
    } else if (finalStatus === 'disconnected' && !this.connectionState.vscode) {
       finalMessage = finalMessage || 'Disconnected. Auto-reconnect may be active.';
    }

    // Reset lastEncryptionError after it has been used to formulate the message
    // This ensures that a successful subsequent connection attempt shows a success message
    // rather than an old encryption error.
    if (finalStatus !== 'error' || (finalStatus === 'error' && !this.lastEncryptionError) ) {
       // If status is not error, or if it is an error but not from lastEncryptionError, clear it.
    }
    // More simply: always clear after using it for one notification cycle,
    // if it happens again, it will be set again.
    // Let's clear it *after* sending the message if the status reflects the error,
    // or if the connection becomes healthy.

    this.updateExtensionIcon(finalStatus);

    const currentLastEncryptionError = this.lastEncryptionError; // Capture before potential clear

    chrome.runtime.sendMessage({
      type: 'CONNECTION_STATUS',
      payload: {
        status: finalStatus,
        message: finalMessage
      },
      timestamp: Date.now()
    }).catch(error => {
      // Ignore errors from disconnected ports
      if (!error.message.includes('Receiving end does not exist')) {
        connectionLogger.error('Error sending connection state', error);
      }
    });

    // If the error was primarily due to encryption and has been reported, clear it
    // so that subsequent status updates (e.g. user manually reconnects and it works) are fresh.
    if (currentLastEncryptionError && finalMessage === currentLastEncryptionError) {
        this.lastEncryptionError = null;
    }
  }

  /**
   * Update extension icon based on connection status
   */
  private updateExtensionIcon(status: string): void {
    let iconPath: string;
    switch (status) {
      case 'connected':
        iconPath = 'icons/icon16-connected.png';
        break;
      case 'authenticating':
      case 'connecting':
        iconPath = 'icons/icon16-partial.png';
        break;
      case 'error':
        iconPath = 'icons/icon16-error.png';
        break;
      default:
        iconPath = 'icons/icon16-disconnected.png';
    }

    chrome.action.setIcon({ path: iconPath }).catch(error => {
      connectionLogger.error('Error updating extension icon', error);
    });
  }

  /**
   * Get connection state
   * @returns Connection state
   */
  getConnectionState(): { vscode: boolean; relay: boolean } {
    return { ...this.connectionState };
  }

  /**
   * Get connection settings
   * @returns Connection settings
   */
  getSettings(): ConnectionSettings {
    return { ...this.settings };
  }

  /**
   * Get authentication manager
   * @returns Authentication manager
   */
  getAuthManager(): AuthManager {
    return this.authManager;
  }

  public setDebugMode(enabled: boolean): void {
    this.settings.debugMode = enabled;
    connectionLogger.setLevel(enabled ? 'debug' : 'info');
    connectionLogger.info(`ConnectionManager debug mode set to: ${enabled}`);
    if (this.wsManager) {
      this.wsManager.setDebug(enabled);
    }
    // Optionally, save this setting if it should persist like other settings
    this.saveSettings({ debugMode: enabled });
  }

  private handleEncryptionUnavailable(errorEvent: { message: string }): void {
    const errorMessage = errorEvent.message || 'Encryption key is not set or available. Cannot send/receive secure messages.';
    connectionLogger.error(`Encryption Unavailable: ${errorMessage}`);
    this.lastEncryptionError = errorMessage;
    // Update overall connection state if necessary, e.g. treat as a critical connection error
    this.connectionState.vscode = false; // Indicate that secure connection is not possible
    this.connectionState.relay = false;
    this.notifyConnectionState();
  }

  private handleEncryptionError(errorEvent: { message: string }): void {
    const errorMessage = errorEvent.message || 'A failure occurred during message encryption.';
    connectionLogger.error(`Encryption Error: ${errorMessage}`);
    this.lastEncryptionError = errorMessage;
    // Update overall connection state
    this.connectionState.vscode = false;
    this.connectionState.relay = false;
    this.notifyConnectionState();
  }
}

// Listener for the extension icon click
chrome.action.onClicked.addListener(() => {
  // Define the popup window options
  const popupUrl = chrome.runtime.getURL('popup.html');
  const windowWidth = 420; // Adjusted width to better fit content
  const windowHeight = 620; // Adjusted height

  // Try to find an existing popup window
  chrome.windows.getAll({ populate: true, windowTypes: ['popup'] }, (windows) => {
    const existingPopup = windows.find(win => win.tabs?.some(t => t.url === popupUrl));

    if (existingPopup && existingPopup.id) {
      // If found, focus it
      chrome.windows.update(existingPopup.id, { focused: true });
    } else {
      // Otherwise, create a new one
      chrome.windows.create({
        url: popupUrl,
        type: 'popup',
        width: windowWidth,
        height: windowHeight,
        // Position the popup (optional, example: top right)
        // top: 0,
        // left: screen.availWidth - windowWidth,
      });
    }
  });
});
