import { AgentDiscoveryService } from '../services/agent-discovery.service.js';
import { AgentType } from '@drizzle/client';
interface RegisterAgentDto {
    name: string;
    description: string;
    type: AgentType;
    userId: string;
    capabilities: string[];
    tools: Record<string, any>;
}
/**
 * Controller for agent discovery and registration
 */
export declare class AgentDiscoveryController {
    private readonly agentDiscoveryService;
    constructor(agentDiscoveryService: AgentDiscoveryService);
    /**
     * Register a new agent
     */
    registerAgent(dto: RegisterAgentDto): Promise<any>;
    /**
     * Discover all MCP tools
     */
    discoverTools(): Promise<Record<string, any>>;
    /**
     * Discover all registered agents
     */
    discoverAgents(): Promise<any>;
    /**
     * Update agent tools
     */
    updateAgentTools(id: string, tools: Record<string, any>): Promise<boolean>;
}
export {};
//# sourceMappingURL=agent-discovery.controller.d.ts.map