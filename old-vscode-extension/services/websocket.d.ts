/// <reference types="node" />
import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
export interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: number;
}
export declare class WebSocketService extends EventEmitter {
    private static instance;
    private server;
    private clients;
    private logger;
    private config;
    private constructor();
    static getInstance(): WebSocketService;
    initialize(): Promise<void>;
    private handleConnection;
    private handleMessage;
    private handleHeartbeat;
    broadcast(message: WebSocketMessage, excludeSender?: WebSocket): void;
    sendTo(ws: WebSocket, message: WebSocketMessage): void;
    private sendError;
    dispose(): void;
}
//# sourceMappingURL=websocket.d.ts.map