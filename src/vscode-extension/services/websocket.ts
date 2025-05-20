import * as WebSocket from 'ws';
import { getLogger,  Logger  } from '../core/logging.js';
import { ConfigurationService } from './configuration.js';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: number;
}

export class WebSocketService extends EventEmitter {
    private static instance: WebSocketService;
    private server: WebSocket.Server | null = null;
    private clients: Set<WebSocket> = new Set();
    private logger: Logger;
    private config: ConfigurationService;

    private constructor() {
        super();
        this.logger = Logger.getInstance();
        this.config = ConfigurationService.getInstance();
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public async initialize(): Promise<void> {
        try {
            const port = this.config.getSetting<number>('mcpPort', 9229);
            this.server = new WebSocket.Server({ port });
            this.logger.info(`WebSocket server initialized on port ${port}`);

            this.server.on('connection', (ws: WebSocket) => {
                this.handleConnection(ws);
            });

            this.server.on('error', (error: Error) => {
                this.logger.error('WebSocket server error:', error);
                this.emit('error', error);
            });
        } catch (error) {
            this.logger.error('Failed to initialize WebSocket server:', error);
            throw error;
        }
    }

    private handleConnection(ws: WebSocket): void {
        this.clients.add(ws);
        this.logger.info(`New client connected. Total clients: ${this.clients.size}`);

        ws.on('message', (data: WebSocket.Data) => {
            try {
                const message = JSON.parse(data.toString()) as WebSocketMessage;
                this.logger.debug('Received message:', message);
                this.emit('message', message, ws);
                this.handleMessage(message, ws);
            } catch (error) {
                this.logger.error('Error processing message:', error);
                this.sendError(ws, 'Invalid message format');
            }
        });

        ws.on('close', () => {
            this.clients.delete(ws);
            this.logger.info(`Client disconnected. Total clients: ${this.clients.size}`);
        });

        ws.on('error', (error: Error) => {
            this.logger.error('WebSocket client error:', error);
            this.clients.delete(ws);
        });
    }

    private handleMessage(message: WebSocketMessage, sender: WebSocket): void {
        switch (message.type) {
            case 'heartbeat':
                this.handleHeartbeat(sender);
                break;
            case 'broadcast':
                this.broadcast(message);
                break;
            default:
                this.emit(message.type, message.payload, sender);
        }
    }

    private handleHeartbeat(ws: WebSocket): void {
        ws.send(JSON.stringify({
            type: 'heartbeat',
            payload: { status: 'alive' },
            timestamp: Date.now()
        }));
    }

    public broadcast(message: WebSocketMessage, excludeSender?: WebSocket): void {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client !== excludeSender && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
        this.logger.debug(`Broadcasted message to ${this.clients.size} clients:`, message);
    }

    public sendTo(ws: WebSocket, message: WebSocketMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            this.logger.debug('Sent message to client:', message);
        }
    }

    private sendError(ws: WebSocket, error: string): void {
        const errorMessage: WebSocketMessage = {
            type: 'error',
            payload: { error },
            timestamp: Date.now()
        };
        this.sendTo(ws, errorMessage);
    }

    public dispose(): void {
        this.clients.forEach(client => {
            client.close();
        });
        this.server?.close();
        this.logger.info('WebSocket service disposed');
    }
}