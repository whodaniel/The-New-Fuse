"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeExtensionHandler = void 0;
const events_1 = require("events");
const logging_1 = require("../src/utils/logging");
const relay_service_1 = require("./relay-service");
const chrome_websocket_service_1 = require("./chrome-websocket-service");
const conversation_manager_1 = require("./conversation-manager");
const shared_1 = require("../types/shared");
class ChromeExtensionHandler extends events_1.EventEmitter {
    constructor() {
        super();
        // Use the new logging functions directly or map them
        this.logger = {
            info: logging_1.log,
            warn: logging_1.logWarning,
            error: logging_1.logError,
        };
        this.status = shared_1.ConnectionStatus.DISCONNECTED;
        this.lastPingTime = 0;
        this.pingInterval = null;
        this.PING_INTERVAL = 10000; // 10 seconds
        this.PING_TIMEOUT = 30000; // 30 seconds
        // Logging is initialized in extension.ts, no need to initialize here
        this.relayService = relay_service_1.RelayService.getInstance();
        this.chromeWebSocketService = chrome_websocket_service_1.ChromeWebSocketService.getInstance();
        this.conversationManager = conversation_manager_1.ConversationManager.getInstance();
        this.setupHandlers();
    }
    static getInstance() {
        if (!ChromeExtensionHandler.instance) {
            ChromeExtensionHandler.instance = new ChromeExtensionHandler();
        }
        return ChromeExtensionHandler.instance;
    }
    setupHandlers() {
        // Register message handlers with relay service
        this.relayService.registerHandler('chrome-extension', async (message) => {
            await this.handleChromeMessage(message);
        });
        // Listen for WebSocket messages
        this.chromeWebSocketService.on('message', async (message) => {
            if (message.type === 'CODE_INPUT') {
                await this.handleCodeInput({
                    id: Date.now().toString(),
                    conversationId: 'chrome-vscode',
                    code: message.code
                });
            }
        });
        // Listen for conversation events
        this.conversationManager.on('messageSent', (message) => {
            if (message.targetAgent === 'chrome-extension') {
                this.sendToChromeExtension(message);
                // Also send to WebSocket clients
                if (message.type === shared_1.MessageType.AI_RESPONSE) {
                    this.chromeWebSocketService.sendAIOutput(message.content);
                }
            }
        });
    }
    async initialize() {
        try {
            // Start ping interval
            this.startPingInterval();
            // Send initial connection request
            await this.sendToChromeExtension({
                command: 'connect',
                data: { source: 'vscode' }
            });
            (0, logging_1.log)('Chrome extension handler initialized');
        }
        catch (error) {
            (0, logging_1.logError)('Failed to initialize Chrome extension handler:', error);
            throw error;
        }
    }
    startPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            this.sendPing();
            this.checkConnection();
        }, this.PING_INTERVAL);
    }
    async sendPing() {
        try {
            await this.sendToChromeExtension({
                command: 'ping',
                data: { timestamp: Date.now() }
            });
        }
        catch (error) {
            (0, logging_1.logError)('Failed to send ping:', error);
        }
    }
    checkConnection() {
        const now = Date.now();
        if (now - this.lastPingTime > this.PING_TIMEOUT) {
            this.updateStatus(shared_1.ConnectionStatus.DISCONNECTED);
        }
    }
    updateStatus(newStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.emit('statusChanged', newStatus);
            (0, logging_1.log)(`Chrome extension connection status: ${newStatus}`);
        }
    }
    async handleChromeMessage(message) {
        try {
            switch (message.command) {
                case 'pong':
                    this.lastPingTime = Date.now();
                    this.updateStatus(shared_1.ConnectionStatus.CONNECTED);
                    break;
                case 'code_input':
                    await this.handleCodeInput(message.data);
                    break;
                case 'ai_request':
                    await this.handleAIRequest(message.data);
                    break;
                case 'conversation_start':
                    await this.handleConversationStart(message.data);
                    break;
                default:
                    this.logger.warn(`Unknown command from Chrome extension: ${message.command}`);
            }
        }
        catch (error) {
            this.logger.error('Error handling Chrome extension message:', error);
        }
    }
    async handleCodeInput(data) {
        const message = {
            id: data.id,
            type: shared_1.MessageType.CODE_INPUT,
            conversationId: data.conversationId,
            sourceAgent: 'chrome-extension',
            targetAgent: 'vscode',
            content: data.code,
            timestamp: Date.now()
        };
        await this.conversationManager.sendMessage(message);
    }
    async handleAIRequest(data) {
        const message = {
            id: data.id,
            type: shared_1.MessageType.AI_REQUEST,
            conversationId: data.conversationId,
            sourceAgent: 'chrome-extension',
            targetAgent: data.targetAgent || 'vscode',
            content: data.request,
            timestamp: Date.now(),
            metadata: data.metadata
        };
        await this.conversationManager.sendMessage(message);
    }
    async handleConversationStart(data) {
        await this.conversationManager.startConversation('chrome-extension', data.targetAgent, data.metadata);
    }
    async sendToChromeExtension(message) {
        try {
            await this.relayService.sendMessage('chrome-extension', message);
        }
        catch (error) {
            (0, logging_1.logError)('Failed to send message to Chrome extension:', error);
            throw error;
        }
    }
    getStatus() {
        return this.status;
    }
    dispose() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.removeAllListeners();
    }
    stopPinging() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}
exports.ChromeExtensionHandler = ChromeExtensionHandler;
//# sourceMappingURL=chrome-extension-handler.js.map