/**
 * WebSocket Transport for The New Fuse Relay System
 *
 * Based on enhanced-tnf-relay.js:412 (startWebSocketServer method)
 * Handles real-time communication with agents and extensions.
 */
import { EventEmitter } from 'events';
import { Transport, RelayMessage } from '../types';
import { Logger } from '../utils/Logger';
export interface WebSocketTransportConfig {
    port: number;
    logger: Logger;
}
export declare class WebSocketTransport extends EventEmitter implements Transport {
    readonly name = "websocket";
    private config;
    private logger;
    private wss;
    private clients;
    private messageHandlers;
    private heartbeatInterval?;
    constructor(config: WebSocketTransportConfig);
    start(): Promise<boolean>;
    stop(): Promise<void>;
    onMessage(handler: (message: RelayMessage) => void): void;
    isConnected(): boolean;
    private handleConnection;
    heartbeatWs: any;
    send(JSON: any, stringify: any): any;
}
//# sourceMappingURL=WebSocketTransport.d.ts.map