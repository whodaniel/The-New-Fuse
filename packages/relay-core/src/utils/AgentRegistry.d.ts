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
    unregisterAgent(agentId: string): Promise<void>;
    getAgent(agentId: string): Agent | undefined;
    getAllAgents(): Agent[];
    getAgentCount(): number;
    updateAgentLastSeen(agentId: string): Promise<void>;
    startDiscovery(): Promise<void>;
    stopDiscovery(): Promise<void>;
}
//# sourceMappingURL=AgentRegistry.d.ts.map