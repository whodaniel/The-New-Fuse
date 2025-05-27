import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import { getLogger,  Logger  } from '../core/logging.js';
import { ConfigurationService } from './configuration.js';
import { MCPHandler } from './mcp-handler.js';

export class WebSocketService extends EventEmitter {
    private static instance: WebSocketService;
    private wss: WebSocket.Server | null = null;
    private clients: Map<string, WebSocket> = new Map();
    private logger: Logger;
    private config: ConfigurationService;
    private mcpHandler: MCPHandler;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.logger = Logger.getInstance();
        this.config = ConfigurationService.getInstance();
        this.mcpHandler = MCPHandler.getInstance();
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public async initialize(): Promise<void> {
        const port = this.config.getSetting<number>('mcpPort') || 9229;

        try {
            this.wss = new WebSocket.Server({ port });
            this.logger.info(`WebSocket server started on port ${port}`);

            this.setupServerEventHandlers();
            this.startHeartbeat();

        } catch (error) {
            this.logger.error('Failed to initialize WebSocket server:', error);
            throw error;
        }
    }

    private setupServerEventHandlers(): void {
        if (!this.wss) {
            return;
        }

        this.wss.on('connection', (ws: WebSocket, req: any) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, ws);

            this.logger.info(`New WebSocket connection established. Client ID: ${clientId}`);

            ws.on('message', async (message: WebSocket.Data) => {
                try {
                    await this.handleMessage(clientId, message);
                } catch (error) {
                    this.logger.error(`Error handling message from client ${clientId}:`, error);
                }
            });

            ws.on('close', () => {
                this.handleClientDisconnection(clientId);
            });

            ws.on('error', (error: Error) => {
                this.logger.error(`WebSocket error for client ${clientId}:`, error);
                this.handleClientDisconnection(clientId);
            });

            // Send initial connection acknowledgment
            this.sendToClient(clientId, {
                type: 'connection_ack',
                clientId,
                timestamp: Date.now()
            });
        });

        this.wss.on('error', (error: Error) => {
            this.logger.error('WebSocket server error:', error);
        });
    }

    private generateClientId(): string {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async handleMessage(clientId: string, message: WebSocket.Data): Promise<void> {
        try {
            const parsedMessage = JSON.parse(message.toString());
            this.logger.debug(`Received message from client ${clientId}:`, parsedMessage);

            if (parsedMessage.type === 'heartbeat') {
                this.handleHeartbeat(clientId);
                return;
            }

            // Handle MCP-related messages
            if (parsedMessage.type === 'mcp_request') {
                const response = await this.mcpHandler.handleRequest(
                    parsedMessage.payload,
                    clientId
                );
                this.sendToClient(clientId, {
                    type: 'mcp_response',
                    requestId: parsedMessage.requestId,
                    payload: response
                });
                return;
            }

            // Emit message event for other handlers
            this.emit('message', {
                clientId,
                message: parsedMessage
            });

        } catch (error) {
            this.logger.error(`Failed to handle message from client ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: 'error',
                error: {
                    code: 'MESSAGE_HANDLING_ERROR',
                    message: (error as Error).message
                }
            });
        }
    }

    private handleHeartbeat(clientId: string): void {
        this.sendToClient(clientId, {
            type: 'heartbeat_ack',
            timestamp: Date.now()
        });
    }

    private startHeartbeat(): void {
        const interval = this.config.getSetting<number>('heartbeatInterval') || 30000;

        this.heartbeatInterval = setInterval(() => {
            this.clients.forEach((ws, clientId) => {
                if (ws.readyState === WebSocket.OPEN) {
                    this.sendToClient(clientId, {
                        type: 'heartbeat',
                        timestamp: Date.now()
                    });
                } else {
                    this.handleClientDisconnection(clientId);
                }
            });
        }, interval);
    }

    private handleClientDisconnection(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            this.clients.delete(clientId);
            this.logger.info(`Client disconnected: ${clientId}`);
            this.emit('clientDisconnected', clientId);

            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        }
    }

    public sendToClient(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            try {
                const message = JSON.stringify(data);
                client.send(message);
                this.logger.debug(`Sent message to client ${clientId}:`, data);
            } catch (error) {
                this.logger.error(`Failed to send message to client ${clientId}:`, error);
            }
        } else {
            this.logger.warn(`Attempted to send message to unavailable client: ${clientId}`);
            this.handleClientDisconnection(clientId);
        }
    }

    public broadcast(data: any, excludeClientId?: string): void {
        const message = JSON.stringify(data);
        this.clients.forEach((client, clientId) => {
            if (clientId !== excludeClientId && client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                    this.logger.debug(`Broadcast message to client ${clientId}:`, data);
                } catch (error) {
                    this.logger.error(`Failed to broadcast to client ${clientId}:`, error);
                    this.handleClientDisconnection(clientId);
                }
            }
        });
    }

    public getConnectedClients(): string[] {
        return Array.from(this.clients.keys());
    }

    public isClientConnected(clientId: string): boolean {
        const client = this.clients.get(clientId);
        return client !== undefined && client.readyState === WebSocket.OPEN;
    }

    public dispose(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.clients.forEach((client, clientId) => {
            try {
                client.close();
                this.logger.debug(`Closed connection for client ${clientId}`);
            } catch (error) {
                this.logger.error(`Error closing connection for client ${clientId}:`, error);
            }
        });

        this.clients.clear();

        if (this.wss) {
            this.wss.close(() => {
                this.logger.info('WebSocket server shut down');
            });
        }
    }
}