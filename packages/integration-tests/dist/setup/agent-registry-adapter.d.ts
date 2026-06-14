/**
 * Agent Registry Adapter
 *
 * Bridges the MasterAgentRegistry to the interface expected by WorkflowEngineFactory
 */
import { MasterAgentRegistry } from '@the-new-fuse/relay-core';
export interface AgentRegistry {
    agents: Map<string, any>;
    getAgent(agentId: string): any | undefined;
    getAgentCount(): number;
    registerAgent(agent: any): void;
    unregisterAgent(agentId: string): boolean;
    getAllAgents(): any[];
    addAgentTodo(agentId: string, taskData: any): Promise<string>;
}
export declare class AgentRegistryAdapter implements AgentRegistry {
    private masterRegistry;
    private legacyAgents;
    constructor(masterRegistry: MasterAgentRegistry);
    get agents(): Map<string, any>;
    getAgent(agentId: string): any | undefined;
    getAgentCount(): number;
    registerAgent(agent: any): void;
    unregisterAgent(agentId: string): boolean;
    getAllAgents(): any[];
    addAgentTodo(agentId: string, taskData: any): Promise<string>;
    private convertToLegacyAgent;
}
//# sourceMappingURL=agent-registry-adapter.d.ts.map