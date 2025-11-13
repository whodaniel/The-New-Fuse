/**
 * HTTP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:333 (startHTTPServer method)
 * Provides a REST API for interacting with the relay.
 */
import { EventEmitter } from 'events';
import { Transport, InterceptRule } from '../types/index.js';
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
}
//# sourceMappingURL=HTTPTransport.d.ts.map