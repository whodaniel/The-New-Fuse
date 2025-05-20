import { EventEmitter } from 'events';
import { WebSocketEvent } from './types.js';
import { Message } from './messageTypes.js';
export interface CommunicationConfig {
    reconnectAttempts?: number;
    reconnectInterval?: number;
    pingInterval?: number;
    timeout?: number;
}
export declare class CommunicationManager extends EventEmitter {
    private static instance;
    private ws;
    private logger;
    private config;
    private reconnectCount;
    private pingTimer?;
    private reconnectTimer?;
    private constructor();
    static getInstance(config?: CommunicationConfig): CommunicationManager;
    connect(url: string): Promise<void>;
    private setupWebSocketHandlers;
    private handleDisconnect;
    private handleMessage;
    private startPingInterval;
    private stopPingInterval;
    send(event: WebSocketEvent): Promise<void>;
    sendMessage(message: Message): Promise<void>;
    disconnect(): void;
    isConnected(): boolean;
}
