/// <reference types="node" />
import { EventEmitter } from 'events';
import { AIAgent, AgentCapability, ConnectionStatus } from '../types/shared.js';
export declare class AgentDiscoveryManager extends EventEmitter {
    private static instance;
    private logger;
    private agents;
    private capabilities;
    private agentStatus;
    private constructor();
    static getInstance(): AgentDiscoveryManager;
    registerAgent(agent: AIAgent): Promise<boolean>;
    unregisterAgent(agentId: string): Promise<boolean>;
    registerCapability(agentId: string, capability: AgentCapability): Promise<boolean>;
    updateAgentStatus(agentId: string, status: ConnectionStatus): Promise<void>;
    getAgent(agentId: string): AIAgent | undefined;
    getAllAgents(): AIAgent[];
    getAgentCapabilities(agentId: string): AgentCapability[];
    getAgentStatus(agentId: string): ConnectionStatus;
    getConnectedAgents(): AIAgent[];
    findAgentsByCapability(capabilityId: string): AIAgent[];
    checkAgentHealth(): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=agent-discovery.d.ts.map