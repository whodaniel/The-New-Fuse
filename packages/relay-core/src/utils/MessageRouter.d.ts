/**
 * Message Router for The New Fuse Relay System
 */
import { EventEmitter } from 'events';
import { RelayMessage, Transport } from '../types/index.js';
import { AgentRegistry } from './AgentRegistry.js';
import { Logger } from './Logger.js';
export declare class MessageRouter extends EventEmitter {
    private logger;
    constructor(logger: Logger);
    route(message: RelayMessage, transports: Map<string, Transport>, agentRegistry: AgentRegistry): Promise<boolean>;
}
//# sourceMappingURL=MessageRouter.d.ts.map