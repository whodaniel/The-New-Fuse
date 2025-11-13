/**
 * MCP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:86 (setupMCPServer method)
 * Handles communication with Model Context Protocol (MCP) clients.
 */
import { EventEmitter } from 'events';
import { Transport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export interface MCPTransportConfig {
    relayId: string;
    version: string;
    logger: Logger;
}
export declare class MCPTransport extends EventEmitter implements Transport {
    readonly name = "mcp";
    private config;
    private logger;
    private mcpServer;
    private messageHandlers;
    constructor(config: MCPTransportConfig);
    start(): Promise<boolean>;
}
//# sourceMappingURL=MCPTransport.d.ts.map