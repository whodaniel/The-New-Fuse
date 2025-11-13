/**
 * Agent controller implementation
 * Provides standardized REST API endpoints for agent operations
 */
import { AgentService } from '../services/agent.service';
import { BaseController } from './base.controller';
import { Agent, AgentStatus, ApiResponse } from '@the-new-fuse/types';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
export declare class AgentController extends BaseController {
    private readonly agentService;
    constructor(agentService: AgentService);
    /**
     * Create a new agent
     * @param data Agent creation data
     * @param user Current user
     * @returns Created agent
     */
    createAgent(data: CreateAgentDto, user?: any): Promise<ApiResponse<Agent>>;
    /**
     * Get all agents for the current user
     * @param user Current user
     * @param capability Optional capability filter
     * @returns Array of agents
     */
    getAgents(user?: any, // Mark user as potentially undefined
    capability?: string, status?: AgentStatus, // Allow filtering by status (useful for services)
    type?: string, // Allow filtering by type
    name?: string): Promise<ApiResponse<Agent[]>>;
    /**
     * Get active agents for the current user
     * @param user Current user
     * @returns Array of active agents
     */
    getActiveAgents(user: any): Promise<ApiResponse<Agent[]>>;
    /**
     * Get agent by ID
     * @param id Agent ID
     * @param user Current user
     * @returns Agent
     */
    getAgentById(id: string, user?: any): Promise<ApiResponse<Agent>>;
    /**
     * Update an agent
     * @param id Agent ID
     * @param updates Agent update data
     * @param user Current user
     * @returns Updated agent
     */
    updateAgent(id: string, updates: UpdateAgentDto, user?: any): Promise<ApiResponse<Agent>>;
    /**
     * Update agent status
     * @param id Agent ID
     * @param status New agent status
     * @param user Current user
     * @returns Updated agent
     */
    updateAgentStatus(id: string, status: AgentStatus, user?: any): Promise<ApiResponse<Agent>>;
    /**
     * Delete an agent
     * @param id Agent ID
     * @param user Current user
     * @returns Success/failure response
     */
    deleteAgent(id: string, user: any): Promise<ApiResponse<boolean>>;
}
//# sourceMappingURL=agent.controller.d.ts.map