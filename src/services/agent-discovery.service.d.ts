import { DatabaseService } from '../lib/drizzle/drizzle.service.js';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { AgentType } from '@drizzle/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
/**
 * Service for discovering and registering agents
 * This implements the standard discovery protocol for all agents
 */
export declare class AgentDiscoveryService {
    private readonly drizzle;
    private readonly mcpBroker;
    private readonly eventEmitter;
    private readonly logger;
    constructor(drizzle: DatabaseService, mcpBroker: MCPBrokerService, eventEmitter: EventEmitter2);
    /**
     * Register a new agent with its tools
     */
    registerAgent(name: string, description: string, type: AgentType, userId: string, capabilities: string[], tools: Record<string, any>): Promise<any>;
    /**
     * Discover all available MCP tools
     */
    discoverMCPTools(): Promise<Record<string, any>>;
    /**
     * Discover all registered agents
     */
    discoverAgents(): Promise<any>;
    /**
     * Update agent tools
     */
    updateAgentTools(agentId: string, tools: Record<string, any>): Promise<boolean>;
    /**
     * Infer capabilities from tool name and description
     */
    private inferCapabilitiesFromTool;
}
//# sourceMappingURL=agent-discovery.service.d.ts.map