/**
 * Agent Registry for The New Fuse Relay System
 */
import { EventEmitter } from 'events';
import { Agent } from '../types/index';
import { Logger } from './Logger';
export declare class AgentRegistry extends EventEmitter {
    private agents;
    private logger;
    constructor(logger: Logger);
    registerAgent(agent: Agent): Promise<void>;
}
//# sourceMappingURL=AgentRegistry.d.ts.map