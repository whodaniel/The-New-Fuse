/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class WebSocketService extends EventEmitter {
    private static instance;
    private wss;
    private clients;
    private logger;
    private config;
    private mcpHandler;
    private heartbeatInterval;
    private constructor();
    static getInstance(): WebSocketService;
    initialize(): Promise<void>;
    private setupServerEventHandlers;
    private generateClientId;
    private handleMessage;
    private handleHeartbeat;
    private startHeartbeat;
    private handleClientDisconnection;
    sendToClient(clientId: string, data: any): void;
    broadcast(data: any, excludeClientId?: string): void;
    getConnectedClients(): string[];
    isClientConnected(clientId: string): boolean;
    dispose(): void;
}
//# sourceMappingURL=websocket-service.d.ts.map