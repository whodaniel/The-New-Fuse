/**
 * Agent Service - Production ready service for agent management
 */
export interface Agent {
    id: string;
    name: string;
    type: string;
    description?: string;
    capabilities: string[];
    status: 'active' | 'inactive' | 'error';
    version: string;
    model?: string;
    provider?: string;
    configuration: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface AgentExecution {
    id: string;
    agentId: string;
    taskId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    input: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
    logs: string[];
}
export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
    category: string;
}
declare class AgentService {
    private baseUrl;
    private apiKey?;
    constructor(baseUrl?: string, apiKey?: string);
    private request;
    getAgents(): Promise<Agent[]>;
    getAgent(id: string): Promise<Agent>;
    createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent>;
    updateAgent(id: string, updates: Partial<Agent>): Promise<Agent>;
    deleteAgent(id: string): Promise<void>;
    executeAgent(agentId: string, task: string, parameters?: Record<string, any>): Promise<AgentExecution>;
    getExecution(executionId: string): Promise<AgentExecution>;
    getExecutions(agentId?: string): Promise<AgentExecution[]>;
    getCapabilities(): Promise<AgentCapability[]>;
    getAgentCapabilities(agentId: string): Promise<AgentCapability[]>;
    getAgentStatus(agentId: string): Promise<{
        status: string;
        health: any;
    }>;
    pingAgent(agentId: string): Promise<boolean>;
    getAgentConfig(agentId: string): Promise<Record<string, any>>;
    updateAgentConfig(agentId: string, config: Record<string, any>): Promise<Record<string, any>>;
    private transformAgent;
    private transformExecution;
}
export declare const agentService: AgentService;
export default AgentService;
