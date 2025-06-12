/**
 * Message handler for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { SecurityManager } from '../utils/security.js';
import { MessageType as SharedMessageType, MessageSource } from '../shared-protocol.js';
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
    /**
     * Create a new MessageHandler
     * @param connectionManager - Connection manager
     * @param backgroundLoggerInstance - Logger instance from background script
     */
    constructor(connectionManager, backgroundLoggerInstance) {
        this.connectionManager = connectionManager;
        this.securityManager = new SecurityManager();
        this.backgroundLogger = backgroundLoggerInstance; // Assign to property
        messageLogger.info('MessageHandler initialized');
    }
    /**
     * Initialize message handler
     */
    initialize() {
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
    handleMessage(message, sender, sendResponse) {
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
                    this.handleSetSharedSecret(message, sendResponse);
                    return true;
                case 'GET_ALL_LOGS':
                    this.handleGetAllLogs(sendResponse);
                    return true; // Indicates asynchronous response
                case 'ENABLE_DEBUG_MODE':
                    this.handleEnableDebugMode(sendResponse);
                    return false; // Or true if any async operations were needed
                case 'DISABLE_DEBUG_MODE':
                    this.handleDisableDebugMode(sendResponse);
                    return false;
                case 'BG_INJECT_SCRIPT_REQUEST':
                    this.handleBgInjectScriptRequest(message.payload, sender, sendResponse);
                    return true; // Indicates asynchronous response
                default:
                    // Forward message to WebSocket server
                    this.handleForwardMessage(message, sendResponse);
                    return false;
            }
        }
        catch (error) {
            messageLogger.error(`Error handling message: ${message.type}`, error);
            sendResponse({ success: false, error: error.message });
            return false;
        }
    }
    /**
     * Handle Background Inject Script Request message with retry logic
     * @param payload - Message payload
     * @param sender - Message sender
     * @param sendResponse - Response callback
     */
    async handleBgInjectScriptRequest(payload, sender, sendResponse) {
        const { tabId, ...originalPayload } = payload;
        messageLogger.info(`Background: Received BG_INJECT_SCRIPT_REQUEST for tab ${tabId}`);
        const maxRetries = 3;
        const retryDelay = 500; // ms
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const responseFromTab = await new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabId, {
                        type: 'INJECT_SCRIPT_REQUEST', // The original message type for the content script
                        payload: originalPayload
                    }, response => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        }
                        else {
                            resolve(response);
                        }
                    });
                });
                // If successful, send response to popup and exit loop
                messageLogger.info(`Background: Successfully sent INJECT_SCRIPT_REQUEST to tab ${tabId} on attempt ${attempt}`);
                sendResponse(responseFromTab); // Forward the content script's response
                return;
            }
            catch (error) {
                messageLogger.warn(`Background: Attempt ${attempt} failed for INJECT_SCRIPT_REQUEST to tab ${tabId}: ${error.message}`);
                if (error.message && error.message.includes("Receiving end does not exist")) {
                    if (attempt < maxRetries) {
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue; // Next attempt
                    }
                    else {
                        // Max retries reached
                        messageLogger.error(`Background: Max retries reached for INJECT_SCRIPT_REQUEST to tab ${tabId}.`);
                        sendResponse({ success: false, message: `Failed to connect to content script in tab ${tabId} after ${maxRetries} attempts. The page might be restricted or not fully loaded.` });
                        return;
                    }
                }
                else {
                    // Other error, not a "Receiving end does not exist" error
                    messageLogger.error(`Background: Non-retryable error for INJECT_SCRIPT_REQUEST to tab ${tabId}: ${error.message}`);
                    sendResponse({ success: false, message: `Error sending message to tab ${tabId}: ${error.message}` });
                    return;
                }
            }
        }
    }
    /**
     * Handle get all logs
     * @param sendResponse - Response callback
     */
    async handleGetAllLogs(sendResponse) {
        messageLogger.info('Received GET_ALL_LOGS request');
        try {
            const result = await chrome.storage.local.get(null);
            const allLogs = []; // Using any[] for LogEntry type from logger.ts
            Object.keys(result).forEach(key => {
                if (key.startsWith('logs_') && Array.isArray(result[key])) {
                    allLogs.push(...result[key]);
                }
            });
            // Sort logs by timestamp
            allLogs.sort((a, b) => {
                // Ensure timestamps are valid Date strings before comparing
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                if (isNaN(dateA) || isNaN(dateB)) {
                    // Handle invalid timestamps if necessary, e.g., by treating them as older or newer
                    return 0;
                }
                return dateA - dateB;
            });
            sendResponse({ success: true, logs: allLogs });
        }
        catch (error) {
            messageLogger.error('Error exporting logs for GET_ALL_LOGS', error);
            sendResponse({ success: false, error: error.message, logs: [] });
        }
    }
    /**
     * Handle Enable Debug Mode message
     * @param sendResponse - Response callback
     */
    handleEnableDebugMode(sendResponse) {
        messageLogger.info('Enabling Debug Mode');
        messageLogger.setLevel('debug');
        this.backgroundLogger.setLevel('debug'); // Control backgroundLogger
        this.connectionManager.setDebugMode(true);
        sendResponse({ success: true, message: 'Debug mode enabled.' });
    }
    /**
     * Handle Disable Debug Mode message
     * @param sendResponse - Response callback
     */
    handleDisableDebugMode(sendResponse) {
        messageLogger.info('Disabling Debug Mode');
        messageLogger.setLevel('info');
        this.backgroundLogger.setLevel('info'); // Control backgroundLogger
        this.connectionManager.setDebugMode(false);
        sendResponse({ success: true, message: 'Debug mode disabled.' });
    }
    /**
     * Handle connect message
     * @param sendResponse - Response callback
     */
    async handleConnect(sendResponse) {
        try {
            const connected = await this.connectionManager.connect();
            sendResponse({ success: connected });
        }
        catch (error) {
            messageLogger.error('Error connecting', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle disconnect message
     * @param sendResponse - Response callback
     */
    handleDisconnect(sendResponse) {
        try {
            this.connectionManager.disconnect();
            sendResponse({ success: true });
        }
        catch (error) {
            messageLogger.error('Error disconnecting', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle send message
     * @param data - Message data
     * @param sendResponse - Response callback
     */
    async handleSendMessage(data, sendResponse) {
        try {
            const sent = await this.connectionManager.sendMessage(data);
            sendResponse({ success: sent });
        }
        catch (error) {
            messageLogger.error('Error sending message', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle get connection state
     * @param sendResponse - Response callback
     */
    handleGetConnectionState(sendResponse) {
        try {
            const state = this.connectionManager.getConnectionState();
            sendResponse({ success: true, state });
        }
        catch (error) {
            messageLogger.error('Error getting connection state', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle get settings
     * @param sendResponse - Response callback
     */
    handleGetSettings(sendResponse) {
        try {
            const settings = this.connectionManager.getSettings();
            sendResponse({ success: true, settings });
        }
        catch (error) {
            messageLogger.error('Error getting settings', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle save settings
     * @param settings - Settings to save
     * @param sendResponse - Response callback
     */
    async handleSaveSettings(settings, sendResponse) {
        try {
            await this.connectionManager.saveSettings(settings);
            sendResponse({ success: true });
        }
        catch (error) {
            messageLogger.error('Error saving settings', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle auth status
     * @param sendResponse - Response callback
     */
    handleAuthStatus(sendResponse) {
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
        }
        catch (error) {
            messageLogger.error('Error getting auth status', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle refresh token
     * @param sendResponse - Response callback
     */
    async handleRefreshToken(sendResponse) {
        try {
            const authManager = this.connectionManager.getAuthManager();
            const refreshed = await authManager.refreshTokens();
            sendResponse({
                success: refreshed,
                error: refreshed ? null : 'Failed to refresh token'
            });
        }
        catch (error) {
            messageLogger.error('Error refreshing token', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle clear auth
     * @param sendResponse - Response callback
     */
    async handleClearAuth(sendResponse) {
        try {
            const authManager = this.connectionManager.getAuthManager();
            await authManager.clearAuth();
            // Disconnect WebSocket
            this.connectionManager.disconnect();
            sendResponse({ success: true });
        }
        catch (error) {
            messageLogger.error('Error clearing auth', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle export logs
     * @param sendResponse - Response callback
     */
    async handleExportLogs(sendResponse) {
        try {
            // Get all logs from storage
            const result = await chrome.storage.local.get(null);
            const logs = {};
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
        }
        catch (error) {
            messageLogger.error('Error exporting logs', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle forward message
     * @param message - Message to forward
     * @param sendResponse - Response callback
     */
    async handleForwardMessage(message, sendResponse) {
        try {
            // Add timestamp if not present
            if (!message.timestamp) {
                message.timestamp = Date.now();
            }
            const sent = await this.connectionManager.sendMessage(message);
            sendResponse({ success: sent });
        }
        catch (error) {
            messageLogger.error('Error forwarding message', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle show notification message
     * @param message - Notification message data
     * @param sendResponse - Response callback
     */
    handleShowNotification(message, sendResponse) {
        try {
            const { title, content, type } = message;
            if (!title || !content) {
                sendResponse({ success: false, error: 'Missing title or content' });
                return;
            }
            this.showNotification(title, content, type || 'info');
            sendResponse({ success: true });
        }
        catch (error) {
            messageLogger.error('Error showing notification', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    /**
     * Handle set shared secret message
     * @param message - Set shared secret message
     * @param sendResponse - Response callback
     */
    async handleSetSharedSecret(message, sendResponse) {
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
            const response = {
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
            this.showNotification('Shared Secret Updated', connected ? 'Shared secret updated and reconnected to VS Code' : 'Shared secret updated but reconnection failed', connected ? 'success' : 'warning');
        }
        catch (error) {
            messageLogger.error('Error setting shared secret', error);
            // Create error response
            const response = {
                id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
                source: MessageSource.CHROME_EXTENSION_BACKGROUND,
                timestamp: Date.now(),
                type: SharedMessageType.SHARED_SECRET_ACK,
                correlationId: message.id,
                payload: {
                    success: false,
                    message: error.message
                }
            };
            sendResponse(response);
            // Show error notification
            this.showNotification('Shared Secret Error', `Failed to set shared secret: ${error.message}`, 'error');
        }
    }
    /**
     * Show notification
     * @param title - Notification title
     * @param message - Notification message
     * @param type - Notification type
     */
    showNotification(title, message, type = 'info') {
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
            const options = {
                type: 'basic',
                iconUrl: iconPath,
                title: title,
                message: message,
                priority: type === 'error' ? 2 : (type === 'warning' ? 1 : 0)
            };
            // Generate a unique notification ID
            const notificationId = `fuse-notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            // Call chrome.notifications.create with the ID and options
            chrome.notifications.create(notificationId, options);
        }
        catch (error) { // Added type annotation
            const errorMessage = error instanceof Error ? error.message : String(error); // Added error handling
            messageLogger.error('Error showing notification:', errorMessage, error); // Log error details
        }
    }
}
//# sourceMappingURL=message-handler.js.map