import { DatabaseService, User } from '@the-new-fuse/database';
import { AgentResponseDto, AgentStatus, AgentType, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
import { AgentProfileDto } from '../agents/dto/agent.dto';
import { AgentService } from '../services/agent.service';
export declare class AgentController {
    private readonly agentService;
    private readonly db;
    /**
     * Constructor for AgentController
     *
     * @param agentService - The agent service instance for handling business logic
     *
     * @example
     * const controller = new AgentController(agentService);
     */
    constructor(agentService: AgentService, db: DatabaseService);
    deployAgent(id: string, payload: {
        target?: 'cloud' | 'local' | 'hybrid';
    }, user: User): Promise<{
        agent: AgentResponseDto;
        deployment: {
            status: 'deployed';
            target: 'cloud' | 'local' | 'hybrid';
            orchestrator: 'kubernetes' | 'docker' | 'hybrid';
            deployedAt: string;
        };
    }>;
    /**
     * Create a new agent
     *
     * Creates a new agent with the provided configuration and associates it
     * with the authenticated user. The agent will be created with a default
     * status and can be activated later.
     *
     * @param createAgentDto - Agent creation data
     * @param createAgentDto.name - Human-readable name for the agent
     * @param createAgentDto.type - Type of agent (chat, task, automation, etc.)
     * @param createAgentDto.description - Detailed description of agent purpose
     * @param createAgentDto.configuration - Agent-specific configuration settings
     * @param createAgentDto.capabilities - List of agent capabilities
     * @param user - Current authenticated user
     *
     * @returns Promise containing created agent details
     * @returns.id - Unique agent identifier
     * @returns.name - Agent name
     * @returns.type - Agent type
     * @returns.status - Initial agent status
     * @returns.configuration - Agent configuration
     * @returns.createdAt - Creation timestamp
     * @returns.userId - Owning user ID
     *
     * @throws BadRequestException - When agent data is invalid or configuration is malformed
     * @throws ConflictException - When agent name already exists for user
     * @throws UnauthorizedException - When user is not authenticated
     *
     * @api
     * POST /agents
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const agent = await agentController.createAgent({
     *   name: "Data Analysis Bot",
     *   type: "analytics",
     *   description: "Processes and analyzes datasets",
     *   configuration: {
     *     "maxQueries": 100,
     *     "timeout": 60
     *   },
     *   capabilities: ["data_processing", "visualization"]
     * }, currentUser);
     *
     * @example
     * // Successful response
     * {
     *   "id": "agent456",
     *   "name": "Data Analysis Bot",
     *   "type": "analytics",
     *   "status": "inactive",
     *   "description": "Processes and analyzes datasets",
     *   "configuration": {
     *     "maxQueries": 100,
     *     "timeout": 60
     *   },
     *   "capabilities": ["data_processing", "visualization"],
     *   "createdAt": "2025-11-05T02:17:55.000Z",
     *   "userId": "user123"
     * }
     */
    createAgent(createAgentDto: CreateAgentDto, user: User): Promise<AgentResponseDto>;
    /**
     * Get agents with optional filtering
     *
     * Retrieves agents for the current user with support for filtering by type,
     * status, or search query. If no filters are provided, returns all agents
     * owned by the current user.
     *
     * @param user - Current authenticated user
     * @param type - Optional agent type filter
     * @param status - Optional agent status filter
     * @param search - Optional search string for agent name/description
     *
     * @returns Promise containing array of agents matching criteria
     * @returns[].id - Agent identifier
     * @returns[].name - Agent name
     * @returns[].type - Agent type
     * @returns[].status - Current agent status
     * @returns[].description - Agent description
     * @returns[].createdAt - Creation timestamp
     * @returns[].lastActiveAt - Last activity timestamp
     *
     * @throws UnauthorizedException - When user is not authenticated
     * @throws BadRequestException - When filter parameters are invalid
     *
     * @api
     * GET /agents
     * GET /agents?type=chat
     * GET /agents?status=active
     * GET /agents?search=support
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * // Get all agents
     * const agents = await agentController.getAgents(currentUser);
     *
     * @example
     * // Get agents by type
     * const chatAgents = await agentController.getAgents(currentUser, 'chat');
     *
     * @example
     * // Search agents
     * const searchResults = await agentController.getAgents(
     *   currentUser,
     *   undefined,
     *   undefined,
     *   'customer'
     * );
     */
    getAgents(user: User, type?: AgentType, status?: AgentStatus, search?: string, page?: string, limit?: string): Promise<AgentResponseDto[]>;
    /**
     * Get all active agents
     *
     * Returns all agents that are currently in an active state across the system.
     * This is commonly used for monitoring and dashboard purposes.
     *
     * @returns Promise containing array of active agents
     * @returns[].id - Agent identifier
     * @returns[].name - Agent name
     * @returns[].type - Agent type
     * @returns[].status - Current status (active)
     * @returns[].metrics - Current agent metrics
     * @returns[].lastHeartbeat - Last heartbeat timestamp
     *
     * @throws InternalServerErrorException - When unable to fetch active agents
     *
     * @api
     * GET /agents/active
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const activeAgents = await agentController.getActiveAgents();
     *
     * @example
     * // Successful response
     * [
     *   {
     *     "id": "agent123",
     *     "name": "Live Chat Support",
     *     "type": "chat",
     *     "status": "active",
     *     "metrics": {
     *       "activeSessions": 5,
     *       "responseTime": 1.2
     *     },
     *     "lastHeartbeat": "2025-11-05T02:17:55.000Z"
     *   }
     * ]
     */
    getActiveAgents(user: User): Promise<AgentResponseDto[]>;
    /**
     * Get agent count by type
     *
     * Returns a breakdown of agent counts grouped by their type. This is useful
     * for analytics and capacity planning.
     *
     * @returns Promise containing record of type to count mapping
     * @returns.chat - Number of chat agents
     * @returns.task - Number of task agents
     * @returns.automation - Number of automation agents
     * @returns.analytics - Number of analytics agents
     *
     * @throws InternalServerErrorException - When unable to fetch type counts
     *
     * @api
     * GET /agents/stats/types
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const typeCounts = await agentController.getAgentTypeCounts();
     *
     * @example
     * // Successful response
     * {
     *   "chat": 12,
     *   "task": 8,
     *   "automation": 5,
     *   "analytics": 3
     * }
     */
    getAgentTypeCounts(user: User): Promise<Record<string, number>>;
    /**
     * Get agent by ID
     *
     * Retrieves detailed information about a specific agent by its unique identifier.
     * Returns full agent details including configuration and current status.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise containing agent details
     * @returns.id - Agent identifier
     * @returns.name - Agent name
     * @returns.type - Agent type
     * @returns.status - Current status
     * @returns.description - Agent description
     * @returns.configuration - Full configuration object
     * @returns.capabilities - Agent capabilities list
     * @returns.metrics - Current performance metrics
     * @returns.createdAt - Creation timestamp
     * @returns.updatedAt - Last update timestamp
     *
     * @throws NotFoundException - When agent with given ID is not found
     * @throws ForbiddenException - When user doesn't have access to this agent
     * @throws InternalServerErrorException - When unable to fetch agent
     *
     * @api
     * GET /agents/:id
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const agent = await agentController.getAgentById('agent123');
     *
     * @example
     * // Successful response
     * {
     *   "id": "agent123",
     *   "name": "Customer Support Bot",
     *   "type": "chat",
     *   "status": "active",
     *   "description": "Handles customer inquiries and support tickets",
     *   "configuration": {
     *     "maxConcurrent": 10,
     *     "responseTimeout": 30,
     *     "escalationEnabled": true
     *   },
     *   "capabilities": ["natural_language", "ticket_creation", "escalation"],
     *   "metrics": {
     *     "uptime": 99.8,
     *     "avgResponseTime": 1.5,
     *     "satisfaction": 4.7
     *   },
     *   "createdAt": "2025-01-01T00:00:00.000Z",
     *   "updatedAt": "2025-11-05T02:17:55.000Z"
     * }
     */
    getAgentById(id: string, user: User): Promise<AgentResponseDto>;
    /**
     * Get agent statistics
     *
     * Returns detailed performance and usage statistics for a specific agent.
     * Includes metrics like uptime, response times, task completion rates,
     * and usage patterns.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise containing agent statistics
     * @returns.uptime - Agent uptime percentage
     * @returns.avgResponseTime - Average response time in seconds
     * @returns.totalTasks - Total number of tasks processed
     * @returns.completedTasks - Number of successfully completed tasks
     * @returns.failedTasks - Number of failed tasks
     * @returns.satisfaction - User satisfaction score (1-5)
     * @returns.usagePattern - Usage statistics over time
     * @returns.lastActiveAt - Last activity timestamp
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have access to this agent
     * @throws InternalServerErrorException - When unable to fetch statistics
     *
     * @api
     * GET /agents/:id/stats
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const stats = await agentController.getAgentStats('agent123');
     *
     * @example
     * // Successful response
     * {
     *   "uptime": 99.2,
     *   "avgResponseTime": 2.1,
     *   "totalTasks": 1547,
     *   "completedTasks": 1512,
     *   "failedTasks": 35,
     *   "successRate": 97.7,
     *   "satisfaction": 4.5,
     *   "usagePattern": [
     *     {
     *       "date": "2025-11-01",
     *       "tasks": 45
     *     }
     *   ],
     *   "lastActiveAt": "2025-11-05T02:15:30.000Z"
     * }
     */
    getAgentStats(id: string, user: User): Promise<any>;
    /**
     * Update agent
     *
     * Updates the configuration and properties of an existing agent. Only
     * mutable properties can be updated (name, description, configuration).
     *
     * @param id - Unique agent identifier
     * @param updateAgentDto - Agent update data
     * @param updateAgentDto.name - New agent name (optional)
     * @param updateAgentDto.description - New agent description (optional)
     * @param updateAgentDto.configuration - Updated configuration (optional)
     * @param updateAgentDto.capabilities - Updated capabilities (optional)
     *
     * @returns Promise containing updated agent details
     * @returns.id - Agent identifier
     * @returns.name - Updated agent name
     * @returns.type - Agent type (unchanged)
     * @returns.status - Current status
     * @returns.configuration - Updated configuration
     * @returns.updatedAt - Update timestamp
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to update this agent
     * @throws BadRequestException - When update data is invalid
     *
     * @api
     * PUT /agents/:id
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const updatedAgent = await agentController.updateAgent('agent123', {
     *   name: "Enhanced Customer Support Bot",
     *   description: "Updated description with new capabilities",
     *   configuration: {
     *     "maxConcurrent": 15,
     *     "responseTimeout": 45
     *   }
     * });
     */
    updateAgent(id: string, updateAgentDto: UpdateAgentDto, user: User): Promise<AgentResponseDto>;
    /**
     * Activate agent
     *
     * Changes the agent status to active, allowing it to start processing
     * tasks and requests. The agent must be in an inactive or error state
     * to be activated.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise containing updated agent details
     * @returns.id - Agent identifier
     * @returns.status - New status (active)
     * @returns.activatedAt - Activation timestamp
     * @returns.heartbeatInterval - Heartbeat interval for monitoring
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to activate this agent
     * @throws BadRequestException - When agent cannot be activated (e.g., already active)
     *
     * @api
     * PUT /agents/:id/activate
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const activatedAgent = await agentController.activateAgent('agent123');
     *
     * @example
     * // Successful response
     * {
     *   "id": "agent123",
     *   "status": "active",
     *   "activatedAt": "2025-11-05T02:17:55.000Z",
     *   "heartbeatInterval": 30
     * }
     */
    activateAgent(id: string, user: User): Promise<AgentResponseDto>;
    /**
     * Deactivate agent
     *
     * Changes the agent status to inactive, stopping it from processing
     * new tasks. Current tasks will be completed or cancelled based on
     * the agent's configuration.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise containing updated agent details
     * @returns.id - Agent identifier
     * @returns.status - New status (inactive)
     * @returns.deactivatedAt - Deactivation timestamp
     * @returns.pendingTasks - Number of tasks still pending completion
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to deactivate this agent
     * @throws BadRequestException - When agent cannot be deactivated
     *
     * @api
     * PUT /agents/:id/deactivate
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const deactivatedAgent = await agentController.deactivateAgent('agent123');
     */
    deactivateAgent(id: string, user: User): Promise<AgentResponseDto>;
    /**
     * Pause agent
     *
     * Temporarily pauses the agent, preventing it from accepting new tasks
     * while allowing current tasks to complete. The agent can be resumed
     * using the activate operation.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise containing updated agent details
     * @returns.id - Agent identifier
     * @returns.status - New status (paused)
     * @returns.pausedAt - Pause timestamp
     * @returns.estimatedResume - Estimated resume time (if specified)
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to pause this agent
     * @throws BadRequestException - When agent cannot be paused
     *
     * @api
     * PUT /agents/:id/pause
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const pausedAgent = await agentController.pauseAgent('agent123');
     */
    pauseAgent(id: string, user: User): Promise<AgentResponseDto>;
    /**
     * Mark agent as busy
     *
     * Changes the agent status to busy, indicating it's currently processing
     * tasks and may have limited availability. This is typically used for
     * temporary high-load situations.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise containing updated agent details
     * @returns.id - Agent identifier
     * @returns.status - New status (busy)
     * @returns.busySince - Timestamp when busy status was set
     * @returns.estimatedAvailable - Estimated time when agent will be available
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to modify this agent
     * @throws BadRequestException - When agent cannot be marked as busy
     *
     * @api
     * PUT /agents/:id/busy
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const busyAgent = await agentController.markAgentBusy('agent123');
     */
    markAgentBusy(id: string, user: User): Promise<AgentResponseDto>;
    /**
     * Mark agent as error
     *
     * Changes the agent status to error, indicating it has encountered
     * an issue and requires attention. This is commonly used when
     * monitoring systems detect agent failures.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise containing updated agent details
     * @returns.id - Agent identifier
     * @returns.status - New status (error)
     * @returns.errorSince - Timestamp when error status was set
     * @returns.errorMessage - Error description (if available)
     * @returns.lastError - Details of the last error encountered
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to modify this agent
     * @throws BadRequestException - When agent cannot be marked as error
     *
     * @api
     * PUT /agents/:id/error
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const errorAgent = await agentController.markAgentError('agent123');
     */
    markAgentError(id: string, user: User): Promise<AgentResponseDto>;
    /**
     * Update agent profile (self-identification)
     *
     * Allows an agent to update its own profile information, including
     * about me, personality, avatar, and other self-describing fields.
     * This is used for agent self-identification and discovery.
     *
     * @param id - Unique agent identifier
     * @param profileDto - Profile update data
     * @param profileDto.about - About me description
     * @param profileDto.personality - Agent personality traits
     * @param profileDto.avatar - Avatar URL or emoji
     * @param profileDto.emoji - Signature emoji
     * @param profileDto.tags - Tags for discovery
     *
     * @returns Promise containing updated agent details
     * @returns.id - Agent identifier
     * @returns.profile - Updated profile object
     * @returns.updatedAt - Update timestamp
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to update this agent
     * @throws BadRequestException - When profile data is invalid
     *
     * @api
     * PUT /agents/:id/profile
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const updatedAgent = await agentController.updateAgentProfile('agent123', {
     *   about: "I am AGENT-09, a helpful AI assistant for The New Fuse project.",
     *   personality: "Friendly, resourceful, proactive",
     *   emoji: "🤖",
     *   tags: ["assistant", "fuse", "development"]
     * });
     */
    updateAgentProfile(id: string, profileDto: AgentProfileDto, user: User): Promise<AgentResponseDto>;
    /**
     * Delete agent
     *
     * Permanently removes the agent from the system. This operation cannot
     * be undone and will also remove associated data like configuration,
     * history, and metrics. The agent must be inactive to be deleted.
     *
     * @param id - Unique agent identifier
     *
     * @returns Promise that resolves when deletion is complete
     *
     * @throws NotFoundException - When agent is not found
     * @throws ForbiddenException - When user doesn't have permission to delete this agent
     * @throws BadRequestException - When agent cannot be deleted (e.g., still active)
     * @throws InternalServerErrorException - When deletion operation fails
     *
     * @api
     * DELETE /agents/:id
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * await agentController.deleteAgent('agent123');
     *
     * @example
     * // Successful response (No Content)
     * HTTP 204 - Agent deleted successfully
     */
    deleteAgent(id: string, user: User): Promise<void>;
    private normalizeMetadata;
    private assertMetadataScope;
}
//# sourceMappingURL=agent.controller.d.ts.map