import { EventEmitter } from 'events';
export declare class WebSocketService extends EventEmitter {
    private readonly baseUrl;
    private readonly options;
    private ws;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private reconnectTimeout;
    private pingInterval;
    constructor(baseUrl: string, options?: {
        reconnectDelay: number;
        pingInterval: number;
    });
    connect(): Promise<void>;
    private setupEventHandlers;
    private handleMessage;
    private handleSessionExpired;
    private handleReconnect;
    private startPingInterval;
    send(type: string, payload?: any): void;
    private cleanup;
    disconnect(): void;
}
export declare const webSocketService: WebSocketService;
