import { EventEmitter } from 'events';
import { log, logError, logWarning, showError, showInfo } from '../src/utils/logging.js';
import { RelayService } from './relay-service.js';
import { ChromeWebSocketService } from './chrome-websocket-service.js';
import { ConversationManager } from './conversation-manager.js';
import {
    ChromeMessage,
    AIMessage,
    MessageType,
    ConnectionStatus
} from '../types/shared.js';

export class ChromeExtensionHandler extends EventEmitter {
    private static instance: ChromeExtensionHandler;
    // Use the new logging functions directly or map them
    private logger = {
        info: log,
        warn: logWarning,
        error: logError,
    };
    private relayService: RelayService;
    private chromeWebSocketService: ChromeWebSocketService;
    private conversationManager: ConversationManager;
    private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private lastPingTime: number = 0;
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly PING_INTERVAL = 10000; // 10 seconds
    private readonly PING_TIMEOUT = 30000; // 30 seconds

    private constructor() {
        super();
        // Logging is initialized in extension.ts, no need to initialize here
        this.relayService = RelayService.getInstance();
        this.chromeWebSocketService = ChromeWebSocketService.getInstance();
        this.conversationManager = ConversationManager.getInstance();
        this.setupHandlers();
    }

    public static getInstance(): ChromeExtensionHandler {
        if (!ChromeExtensionHandler.instance) {
            ChromeExtensionHandler.instance = new ChromeExtensionHandler();
        }
        return ChromeExtensionHandler.instance;
    }

    private setupHandlers(): void {
        // Register message handlers with relay service
        this.relayService.registerHandler('chrome-extension', async (message: ChromeMessage) => {
            await this.handleChromeMessage(message);
        });

        // Listen for WebSocket messages
        this.chromeWebSocketService.on('message', async (message: any) => {
            if (message.type === 'CODE_INPUT') {
                await this.handleCodeInput({
                    id: Date.now().toString(),
                    conversationId: 'chrome-vscode',
                    code: message.code
                });
            }
        });

        // Listen for conversation events
        this.conversationManager.on('messageSent', (message: AIMessage) => {
            if (message.targetAgent === 'chrome-extension') {
                this.sendToChromeExtension(message);

                // Also send to WebSocket clients
                if (message.type === MessageType.AI_RESPONSE) {
                    this.chromeWebSocketService.sendAIOutput(message.content);
                }
            }
        });
    }

    public async initialize(): Promise<void> {
        try {
            // Start ping interval
            this.startPingInterval();

            // Send initial connection request
            await this.sendToChromeExtension({
                command: 'connect',
                data: { source: 'vscode' }
            });

            log('Chrome extension handler initialized');
        } catch (error) {
            logError('Failed to initialize Chrome extension handler:', error);
            throw error;
        }
    }

    private startPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            this.sendPing();
            this.checkConnection();
        }, this.PING_INTERVAL);
    }

    private async sendPing(): Promise<void> {
        try {
            await this.sendToChromeExtension({
                command: 'ping',
                data: { timestamp: Date.now() }
            });
        } catch (error) {
            logError('Failed to send ping:', error);
        }
    }

    private checkConnection(): void {
        const now = Date.now();
        if (now - this.lastPingTime > this.PING_TIMEOUT) {
            this.updateStatus(ConnectionStatus.DISCONNECTED);
        }
    }

    private updateStatus(newStatus: ConnectionStatus): void {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.emit('statusChanged', newStatus);
            log(`Chrome extension connection status: ${newStatus}`);
        }
    }

    private async handleChromeMessage(message: ChromeMessage): Promise<void> {
        try {
            switch (message.command) {
                case 'pong':
                    this.lastPingTime = Date.now();
                    this.updateStatus(ConnectionStatus.CONNECTED);
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
        } catch (error) {
            this.logger.error('Error handling Chrome extension message:', error);
        }
    }

    private async handleCodeInput(data: any): Promise<void> {
        const message: AIMessage = {
            id: data.id,
            type: MessageType.CODE_INPUT,
            conversationId: data.conversationId,
            sourceAgent: 'chrome-extension',
            targetAgent: 'vscode',
            content: data.code,
            timestamp: Date.now()
        };

        await this.conversationManager.sendMessage(message);
    }

    private async handleAIRequest(data: any): Promise<void> {
        const message: AIMessage = {
            id: data.id,
            type: MessageType.AI_REQUEST,
            conversationId: data.conversationId,
            sourceAgent: 'chrome-extension',
            targetAgent: data.targetAgent || 'vscode',
            content: data.request,
            timestamp: Date.now(),
            metadata: data.metadata
        };

        await this.conversationManager.sendMessage(message);
    }

    private async handleConversationStart(data: any): Promise<void> {
        await this.conversationManager.startConversation(
            'chrome-extension',
            data.targetAgent,
            data.metadata
        );
    }

    private async sendToChromeExtension(message: any): Promise<void> {
        try {
            await this.relayService.sendMessage('chrome-extension', message);
        } catch (error) {
            logError('Failed to send message to Chrome extension:', error);
            throw error;
        }
    }

    public getStatus(): ConnectionStatus {
        return this.status;
    }

    public dispose(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval as NodeJS.Timeout);
        }
        this.removeAllListeners();
    }

    private stopPinging() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}