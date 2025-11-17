/**
 * HTTP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:333 (startHTTPServer method)
 * Provides a REST API for interacting with the relay.
 */
import { EventEmitter } from 'events';
import { Transport, RelayMessage, InterceptRule } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export interface HTTPTransportConfig {
    port: number;
    logger: Logger;
    interceptRules: Map<string, InterceptRule>;
}
export declare class HTTPTransport extends EventEmitter implements Transport {
    readonly name = "http";
    private config;
    private logger;
    private server;
    private messageHandlers;
    constructor(config: HTTPTransportConfig);
    start(): Promise<boolean>;
    stop(): Promise<void>;
    send(message: RelayMessage): Promise<boolean>;
    onMessage(handler: (message: RelayMessage) => void): void;
    isConnected(): boolean;
    private setupRoutes;
}
//# sourceMappingURL=HTTPTransport.d.ts.map