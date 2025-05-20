import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import { ExtensionLogger, getLogger } from '../core/logging.js';

export interface WebViewMessage {
    command: string;
    data?: any;
    text?: string;
    timestamp?: string;
}

type MessageHandler = (message: WebViewMessage) => Promise<void>;

export interface RelayServiceOptions {
    port?: number;
    logger?: ExtensionLogger;
}

export class RelayService {
    private static instance: RelayService;
    private logger: ExtensionLogger;
    private connections: Map<string, any> = new Map();
    private handlers: Map<string, MessageHandler> = new Map();
    private wsServer: WebSocketServer | null = null;
    private wsClient: WebSocket | null = null;
    private port: number;

    constructor(options: RelayServiceOptions = {}) {
        this.port = options.port || 3000;
        this.logger = options.logger || getLogger();
    }

    public async initialize(): Promise<void> {
        try {
            // Start WebSocket server for Chrome extension
            this.wsServer = new WebSocketServer({ port: this.port });
            
            this.wsServer.on('connection', (ws) => {
                ws.on('message', async (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        await this.handleWebSocketMessage(message);
                    } catch (error) {
                        this.logger.error('Error handling WebSocket message:', error);
                    }
                });
            });

            this.logger.info(`WebSocket server started on port ${this.port}`);

            // Fix WebSocket client creation
            try {
                // Use WebSocket from 'ws' with type assertion to avoid TypeScript errors
                // In browser environments, you would use the native WebSocket API instead
                const WebSocketConstructor = WebSocket as any;
                this.wsClient = new WebSocketConstructor(`ws://localhost:${this.port}`);
                
                if (this.wsClient) {
                    this.wsClient.on('open', () => {
                        this.logger.info('Connected to relay server'); // Changed log to info
                    });

                    this.wsClient.on('message', async (data) => {
                        try {
                            const message = JSON.parse(data.toString());
                            await this.handleRelayMessage(message);
                        } catch (error) {
                            this.logger.error('Error handling relay message:', error);
                        }
                    });
                }
            } catch (error) {
                this.logger.warn('Failed to connect to relay server:', error);
                // Continue without client connection - this shouldn't halt initialization
            }
        } catch (error) {
            this.logger.error('Failed to initialize relay service:', error);
            throw error;
        }
    }

    public registerHandler(command: string, handler: MessageHandler): void {
        this.handlers.set(command, handler);
        this.logger.info(`Registered handler for command: ${command}`);
    }

    public unregisterHandler(command: string): void {
        if (this.handlers.delete(command)) {
            this.logger.info(`Unregistered handler for command: ${command}`);
        }
    }

    private async handleWebSocketMessage(message: WebViewMessage): Promise<void> {
        const handler = this.handlers.get(message.command);
        if (handler) {
            await handler(message);
        } else {
            this.logger.warn(`No handler found for command: ${message.command}`);
        }
    }

    private async handleRelayMessage(message: WebViewMessage): Promise<void> {
        // Forward message to appropriate connection
        const connection = this.connections.get(message.command);
        if (connection) {
            try {
                if ('postMessage' in connection) {
                    // WebView connection
                    connection.postMessage(message);
                } else if ('send' in connection) {
                    // WebSocket connection
                    connection.send(JSON.stringify(message));
                }
            } catch (error) {
                this.logger.error(`Failed to relay message to ${message.command}:`, error);
            }
        }
    }

    /**
     * Register a connection with the relay service
     */
    public registerConnection(id: string, connection: any): void {
        this.connections.set(id, connection);
        this.logger.info(`Registered connection: ${id}`);
    }

    /**
     * Unregister a connection from the relay service
     */
    public unregisterConnection(id: string): void {
        if (this.connections.delete(id)) {
            this.logger.info(`Unregistered connection: ${id}`);
        }
    }

    /**
     * Send a message to a specific connection
     */
    public sendMessage(id: string, message: WebViewMessage): void {
        const connection = this.connections.get(id);
        if (connection) {
            try {
                if ('postMessage' in connection) {
                    // WebView connection
                    connection.postMessage(message);
                } else if ('send' in connection) {
                    // WebSocket connection
                    connection.send(JSON.stringify(message));
                }
            } catch (error) {
                this.logger.error(`Failed to send message to ${id}:`, error);
            }
        } else {
            this.logger.warn(`No connection found for id: ${id}`);
        }
    }

    /**
     * Send a message to all web clients
     */
    public async sendMessageToWeb(message: WebViewMessage): Promise<void> {
        if (this.wsServer) {
            this.wsServer.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN is 1
                    client.send(JSON.stringify(message));
                }
            });
        } else {
            this.logger.warn('WebSocket server not initialized');
        }
    }

    /**
     * Get the current connection status
     */
    public getConnectionStatus(): boolean {
        return this.wsServer !== null;
    }

    /**
     * Broadcast a message to all connections
     */
    public broadcast(message: WebViewMessage): void {
        this.connections.forEach((connection, id) => {
            try {
                if ('postMessage' in connection) {
                    // WebView connection
                    connection.postMessage(message);
                } else if ('send' in connection) {
                    // WebSocket connection
                    connection.send(JSON.stringify(message));
                }
            } catch (error) {
                this.logger.error(`Failed to broadcast message to ${id}:`, error);
            }
        });

        // Also broadcast through WebSocket server if available
        if (this.wsServer) {
            this.wsServer.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN is 1
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    public dispose(): void {
        this.wsServer?.close();
        this.wsClient?.close();
        this.connections.clear();
        this.handlers.clear();
    }
}
