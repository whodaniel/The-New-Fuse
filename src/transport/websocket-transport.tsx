import * as WebSocket from 'ws';
import * as vscode from 'vscode';
import { ITransport, TransportMessage, TransportOptions } from './transport-interface.js';

export class WebSocketTransport implements ITransport {
    private ws: WebSocket | null = null;
    private messageQueue: TransportMessage[] = [];
    private messageHandlers: Map<string, (message: TransportMessage) => void>;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts: number;
    private isConnecting = false;

    constructor(
        private readonly url: string,
        private options: TransportOptions = {}
    ) {
        this.messageHandlers = new Map();
        this.maxReconnectAttempts = options.retryAttempts || 5;
    }

    public async initialize(): Promise<void> {
        await this.connect();
    }

    private async connect(): Promise<void> {
        if (this.isConnecting) return;
        this.isConnecting = true;

        try {
            this.ws = new WebSocket(this.url);
            this.setupWebSocketHandlers();
            await this.waitForConnection();
            this.reconnectAttempts = 0;
            this.processMessageQueue();
        } catch (error) {
            await this.handleConnectionError();
        } finally {
            this.isConnecting = false;
        }
    }

    private async waitForConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, this.options.timeout || 5000);

            this.ws!.once('open', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }

    private async handleConnectionError(): Promise<void> {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.connect();
        } else {
            throw new Error('Max reconnection attempts reached');
        }
    }

    private setupWebSocketHandlers(): void {
        if (!this.ws) return;

        this.ws.on('message', (data: string) => {
            try {
                const message = JSON.parse(data) as TransportMessage;
                this.handleIncomingMessage(message);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        });

        this.ws.on('close', () => this.handleReconnection());
        this.ws.on('error', (error) => console.error('WebSocket error:', error));
    }

    private handleIncomingMessage(message: TransportMessage): void {
        if (this.options.validator && !this.options.validator.validate(message)) {
            console.error('Invalid message received:', this.options.validator.getValidationErrors());
            return;
        }

        if (this.options.priorityThreshold !== undefined && 
            (message.priority || 0) < this.options.priorityThreshold) {
            return;
        }

        this.messageHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Message handler error:', error);
            }
        });
    }

    private async handleReconnection(): Promise<void> {
        if (!this.isConnecting) {
            await this.connect();
        }
    }

    public async send(message: TransportMessage): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.messageQueue.push(message);
            await this.connect();
            return;
        }

        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            this.messageQueue.push(message);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    private async processMessageQueue(): Promise<void> {
        while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
            const message = this.messageQueue.shift();
            if (message) {
                await this.send(message);
            }
        }
    }

    public dispose(): void {
        this.ws?.close();
        this.messageHandlers.clear();
        this.messageQueue = [];
    }

    // ... rest of implementation details
}
