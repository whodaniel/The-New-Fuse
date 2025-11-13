/**
 * Unified Relay Server for The New Fuse Framework
 *
 * Consolidates functionality from:
 * - comprehensive-tnf-relay.js
 * - enhanced-tnf-relay.js
 * - basic-relay.js
 * - relay-adapter.js
 * - message-bridge.js
 */
import { EventEmitter } from 'events';
import { RelayConfig } from '../types/index.js';
export declare class RelayServer extends EventEmitter {
    private config;
    private logger;
    private transports;
    private agentRegistry;
    private messageRouter;
    private bridge;
    private protocolTranslator;
    private systemStatus;
    private isRunning;
    private interceptedMessages;
    private orchestratorService;
    constructor(config: RelayConfig);
}
//# sourceMappingURL=RelayServer.d.ts.map