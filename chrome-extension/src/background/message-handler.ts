/**
 * Message handler for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { ConnectionManager } from './connection-manager.js';
import { SecurityManager } from '../utils/security.js';
import {
  MessageType as SharedMessageType,
  MessageSource,
  SetSharedSecretRequestMessage,
  SharedSecretAckMessage,
  BaseMessage
} from '../shared-protocol.js';

// Create a message-specific logger
const messageLogger = new Logger({
  name: 'MessageHandler',
  level: 'info',
  saveToStorage: true
});

/**
 * Message handler
 */
export class MessageHandler {
  private connectionManager: ConnectionManager;
  private securityManager: SecurityManager;

  /**
   * Create a new MessageHandler
   * @param connectionManager - Connection manager
   */
  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
    this.securityManager = new SecurityManager();
    messageLogger.info('MessageHandler initialized');
  }

  /**
   * Initialize message handler
   */
  initialize(): void {
    // Set up message listener
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    messageLogger.info('Message listener initialized');
  }

  /**
   * Handle message from extension
   * @param message - Message data
   * @param sender - Message sender
   * @param sendResponse - Response callback
   * @returns Whether response will be sent asynchronously
   */
  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean {
    if (!message || typeof message !== 'object' || !message.type) {
      return false;
    }

    messageLogger.debug(`Received message: ${message.type}`, { message, sender });

    try {
      switch (message.type) {
        case 'CONNECT':
          this.handleConnect(sendResponse);
          return true;

        case 'DISCONNECT':
          this.handleDisconnect(sendResponse);
          return false;

        case 'SEND_MESSAGE':
          this.handleSendMessage(message.data, sendResponse);
          return false;

        case 'GET_CONNECTION_STATE':
          this.handleGetConnectionState(sendResponse);
          return false;

        case 'GET_SETTINGS':
          this.handleGetSettings(sendResponse);
          return false;

        case 'SAVE_SETTINGS':
          this.handleSaveSettings(message.settings, sendResponse);
          return true;

        case 'AUTH_STATUS':
          this.handleAuthStatus(sendResponse);
          return false;

        case 'REFRESH_TOKEN':
          this.handleRefreshToken(sendResponse);
          return true;

        case 'CLEAR_AUTH':
          this.handleClearAuth(sendResponse);
          return true;

        case 'EXPORT_LOGS':
          this.handleExportLogs(sendResponse);
          return true;

        case 'SHOW_NOTIFICATION':
          this.handleShowNotification(message, sendResponse);
          return false;

        case SharedMessageType.SET_SHARED_SECRET_REQUEST:
          this.handleSetSharedSecret(message as SetSharedSecretRequestMessage, sendResponse);
          return true;

        default:
          // Forward message to WebSocket server
          this.handleForwardMessage(message, sendResponse);
          return false;
      }
    } catch (error) {
      messageLogger.error(`Error handling message: ${message.type}`, error);
      sendResponse({ success: false, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Handle connect message
   * @param sendResponse - Response callback
   */
  private async handleConnect(sendResponse: (response?: any) => void): Promise<void> {
    try {
      const connected = await this.connectionManager.connect();
      sendResponse({ success: connected });
    } catch (error) {
      messageLogger.error('Error connecting', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle disconnect message
   * @param sendResponse - Response callback
   */
  private handleDisconnect(sendResponse: (response?: any) => void): void {
    try {
      this.connectionManager.disconnect();
      sendResponse({ success: true });
    } catch (error) {
      messageLogger.error('Error disconnecting', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle send message
   * @param data - Message data
   * @param sendResponse - Response callback
   */
  private async handleSendMessage(data: any, sendResponse: (response?: any) => void): Promise<void> {
    try {
      const sent = await this.connectionManager.sendMessage(data);
      sendResponse({ success: sent });
    } catch (error) {
      messageLogger.error('Error sending message', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle get connection state
   * @param sendResponse - Response callback
   */
  private handleGetConnectionState(sendResponse: (response?: any) => void): void {
    try {
      const state = this.connectionManager.getConnectionState();
      sendResponse({ success: true, state });
    } catch (error) {
      messageLogger.error('Error getting connection state', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle get settings
   * @param sendResponse - Response callback
   */
  private handleGetSettings(sendResponse: (response?: any) => void): void {
    try {
      const settings = this.connectionManager.getSettings();
      sendResponse({ success: true, settings });
    } catch (error) {
      messageLogger.error('Error getting settings', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle save settings
   * @param settings - Settings to save
   * @param sendResponse - Response callback
   */
  private async handleSaveSettings(settings: any, sendResponse: (response?: any) => void): Promise<void> {
    try {
      await this.connectionManager.saveSettings(settings);
      sendResponse({ success: true });
    } catch (error) {
      messageLogger.error('Error saving settings', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle auth status
   * @param sendResponse - Response callback
   */
  private handleAuthStatus(sendResponse: (response?: any) => void): void {
    try {
      const authManager = this.connectionManager.getAuthManager();
      const state = authManager.getAuthState();
      const tokenValid = authManager.isTokenValid();
      const tokenExpiry = authManager.getTokenExpiry();

      sendResponse({
        success: true,
        state,
        tokenValid,
        tokenExpiry: tokenExpiry?.toISOString()
      });
    } catch (error) {
      messageLogger.error('Error getting auth status', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle refresh token
   * @param sendResponse - Response callback
   */
  private async handleRefreshToken(sendResponse: (response?: any) => void): Promise<void> {
    try {
      const authManager = this.connectionManager.getAuthManager();
      const refreshed = await authManager.refreshTokens();

      sendResponse({
        success: refreshed,
        error: refreshed ? null : 'Failed to refresh token'
      });
    } catch (error) {
      messageLogger.error('Error refreshing token', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle clear auth
   * @param sendResponse - Response callback
   */
  private async handleClearAuth(sendResponse: (response?: any) => void): Promise<void> {
    try {
      const authManager = this.connectionManager.getAuthManager();
      await authManager.clearAuth();

      // Disconnect WebSocket
      this.connectionManager.disconnect();

      sendResponse({ success: true });
    } catch (error) {
      messageLogger.error('Error clearing auth', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle export logs
   * @param sendResponse - Response callback
   */
  private async handleExportLogs(sendResponse: (response?: any) => void): Promise<void> {
    try {
      // Get all logs from storage
      const result = await chrome.storage.local.get(null);
      const logs: Record<string, any> = {};

      // Filter log entries
      Object.keys(result).forEach(key => {
        if (key.startsWith('logs_')) {
          logs[key] = result[key];
        }
      });

      sendResponse({
        success: true,
        logs: JSON.stringify(logs, null, 2)
      });
    } catch (error) {
      messageLogger.error('Error exporting logs', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle forward message
   * @param message - Message to forward
   * @param sendResponse - Response callback
   */
  private async handleForwardMessage(message: any, sendResponse: (response?: any) => void): Promise<void> {
    try {
      // Add timestamp if not present
      if (!message.timestamp) {
        message.timestamp = Date.now();
      }

      const sent = await this.connectionManager.sendMessage(message);
      sendResponse({ success: sent });
    } catch (error) {
      messageLogger.error('Error forwarding message', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle show notification message
   * @param message - Notification message data
   * @param sendResponse - Response callback
   */
  private handleShowNotification(message: any, sendResponse: (response?: any) => void): void {
    try {
      const { title, content, type } = message;

      if (!title || !content) {
        sendResponse({ success: false, error: 'Missing title or content' });
        return;
      }

      this.showNotification(title, content, type || 'info');
      sendResponse({ success: true });
    } catch (error) {
      messageLogger.error('Error showing notification', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle set shared secret message
   * @param message - Set shared secret message
   * @param sendResponse - Response callback
   */
  private async handleSetSharedSecret(
    message: SetSharedSecretRequestMessage,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      const { secret } = message.payload;

      if (!secret) {
        sendResponse({
          success: false,
          error: 'Missing shared secret'
        });
        return;
      }

      // Set the shared secret in the security manager
      await this.securityManager.setSharedSecret(secret);

      // Disconnect and reconnect to apply the new secret
      this.connectionManager.disconnect();
      const connected = await this.connectionManager.connect();

      // Create response message
      const response: SharedSecretAckMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        source: MessageSource.CHROME_EXTENSION_BACKGROUND,
        timestamp: Date.now(),
        type: SharedMessageType.SHARED_SECRET_ACK,
        correlationId: message.id,
        payload: {
          success: true,
          message: connected ? 'Shared secret set and reconnected' : 'Shared secret set but reconnection failed'
        }
      };

      sendResponse(response);

      // Show notification
      this.showNotification(
        'Shared Secret Updated',
        connected ? 'Shared secret updated and reconnected to VS Code' : 'Shared secret updated but reconnection failed',
        connected ? 'success' : 'warning'
      );
    } catch (error) {
      messageLogger.error('Error setting shared secret', error);

      // Create error response
      const response: SharedSecretAckMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        source: MessageSource.CHROME_EXTENSION_BACKGROUND,
        timestamp: Date.now(),
        type: SharedMessageType.SHARED_SECRET_ACK,
        correlationId: message.id,
        payload: {
          success: false,
          message: (error as Error).message
        }
      };

      sendResponse(response);

      // Show error notification
      this.showNotification(
        'Shared Secret Error',
        `Failed to set shared secret: ${(error as Error).message}`,
        'error'
      );
    }
  }

  /**
   * Show notification
   * @param title - Notification title
   * @param message - Notification message
   * @param type - Notification type
   */
  private showNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    try {
      // Get icon based on type
      let iconPath = 'icons/icon48.png';

      // Use different icons based on notification type
      switch (type) {
        case 'success':
          iconPath = 'icons/icon48-success.png'; // Assuming you have this icon
          break;
        case 'warning':
          iconPath = 'icons/icon48-warning.png'; // Assuming you have this icon
          break;
        case 'error':
          iconPath = 'icons/icon48-error.png';
          break;
        // Default 'info' uses icon48.png
      }

      // Create notification options
      const options: chrome.notifications.NotificationOptions = {
        type: 'basic',
        iconUrl: iconPath,
        title: title,
        message: message,
        priority: type === 'error' ? 2 : (type === 'warning' ? 1 : 0)
      };

      // Generate a unique notification ID
      const notificationId = `fuse-notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Call chrome.notifications.create with the ID and options
      chrome.notifications.create(notificationId, options as chrome.notifications.NotificationOptions<true>);
    } catch (error: unknown) { // Added type annotation
      const errorMessage = error instanceof Error ? error.message : String(error); // Added error handling
      messageLogger.error('Error showing notification:', errorMessage, error); // Log error details
    }
  }
}
