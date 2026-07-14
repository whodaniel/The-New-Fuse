"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const database_1 = require("@the-new-fuse/database");
const types_1 = require("@the-new-fuse/types");
const agent_dto_1 = require("../agents/dto/agent.dto");
const auth_policy_1 = require("../auth/auth-policy");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const agent_service_1 = require("../services/agent.service");
let AgentController = class AgentController {
    /**
     * Constructor for AgentController
     *
     * @param agentService - The agent service instance for handling business logic
     *
     * @example
     * const controller = new AgentController(agentService);
     */
    constructor(agentService, db) {
        this.agentService = agentService;
        this.db = db;
    }
    async deployAgent(id, payload, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.deployAgent(id, user.id, payload?.target || 'cloud');
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to deploy agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async createAgent(createAgentDto, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            const metadata = this.normalizeMetadata(createAgentDto.metadata);
            await this.assertMetadataScope(metadata, user);
            // Add userId from authenticated user
            const agentData = {
                ...createAgentDto,
                userId: user.id,
            };
            return await this.agentService.createAgent(agentData, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to create agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async getAgents(user, type, status, search, page, limit) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            const pageNum = page ? parseInt(page) : 1;
            const limitNum = limit ? parseInt(limit) : 50;
            if (type) {
                const result = await this.agentService.findAgentsByType(type, user.id, pageNum, limitNum);
                return result.data;
            }
            if (status) {
                return await this.agentService.findAgentsByStatus(status, user.id);
            }
            if (search) {
                const result = await this.agentService.searchAgents(user.id, search, pageNum, limitNum);
                return result.data;
            }
            const result = await this.agentService.findAgentsByUserId(user.id, pageNum, limitNum);
            return result.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch agents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async getActiveAgents(user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return this.agentService.getActiveAgents(user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch active agents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async getAgentTypeCounts(user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return this.agentService.getAgentTypeCounts(user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch agent type counts', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async getAgentById(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.findAgentById(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async getAgentStats(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.getAgentStats(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch agent stats', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async updateAgent(id, updateAgentDto, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            const metadata = this.normalizeMetadata(updateAgentDto.metadata);
            await this.assertMetadataScope(metadata, user);
            return await this.agentService.updateAgent(id, updateAgentDto, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to update agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async activateAgent(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.activateAgent(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to activate agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async deactivateAgent(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.deactivateAgent(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to deactivate agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async pauseAgent(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.pauseAgent(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to pause agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async markAgentBusy(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.markAgentBusy(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to mark agent as busy', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async markAgentError(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.markAgentError(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to mark agent as error', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async updateAgentProfile(id, profileDto, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentService.updateAgentProfile(id, profileDto, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to update agent profile', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
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
    async deleteAgent(id, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            await this.agentService.deleteAgent(id, user.id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to delete agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    normalizeMetadata(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            return null;
        }
        return input;
    }
    async assertMetadataScope(metadata, user) {
        if (!metadata)
            return;
        const privileged = (0, auth_policy_1.isPrivilegedUser)(user || {});
        const tenantId = typeof metadata.tenantId === 'string' ? metadata.tenantId.trim() : undefined;
        const agencyId = typeof metadata.agencyId === 'string' ? metadata.agencyId.trim() : undefined;
        const workspaceId = typeof metadata.workspaceId === 'string' ? metadata.workspaceId.trim() : undefined;
        const userId = typeof metadata.userId === 'string' ? metadata.userId.trim() : undefined;
        if (userId && user?.id && userId !== user.id && !privileged) {
            throw new common_1.HttpException('metadata.userId mismatch for authenticated user', common_1.HttpStatus.FORBIDDEN);
        }
        if (tenantId) {
            if (user?.tenantId && tenantId !== user.tenantId && !privileged) {
                throw new common_1.HttpException('metadata.tenantId mismatch for authenticated user', common_1.HttpStatus.FORBIDDEN);
            }
            if (!user?.tenantId && !privileged) {
                throw new common_1.HttpException('metadata.tenantId requires a tenant-scoped user', common_1.HttpStatus.FORBIDDEN);
            }
        }
        if (agencyId) {
            if (user?.agencyId && agencyId !== user.agencyId && !privileged) {
                throw new common_1.HttpException('metadata.agencyId mismatch for authenticated user', common_1.HttpStatus.FORBIDDEN);
            }
            if (!user?.agencyId && !privileged) {
                throw new common_1.HttpException('metadata.agencyId requires an agency-scoped user', common_1.HttpStatus.FORBIDDEN);
            }
        }
        if (workspaceId) {
            const workspace = await this.db.workspaces.findByIdWithOwner(workspaceId);
            if (!workspace) {
                throw new common_1.HttpException('Workspace not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (!privileged && workspace.ownerId !== user?.id) {
                const membership = user?.id
                    ? await this.db.workspaceMembers.findMembership(workspaceId, user.id)
                    : null;
                if (!membership) {
                    throw new common_1.HttpException('Workspace access denied', common_1.HttpStatus.FORBIDDEN);
                }
            }
        }
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)(':id/deploy'),
    (0, swagger_1.ApiOperation)({ summary: 'Deploy agent to orchestrator target' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deployAgent", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.CreateAgentDto, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all agents' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [types_1.AgentResponseDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active agents' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [types_1.AgentResponseDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getActiveAgents", null);
__decorate([
    (0, common_1.Get)('stats/types'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent count by type' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentTypeCounts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent statistics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentStats", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, types_1.UpdateAgentDto, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Put)(':id/activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "activateAgent", null);
__decorate([
    (0, common_1.Put)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deactivateAgent", null);
__decorate([
    (0, common_1.Put)(':id/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pause agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "pauseAgent", null);
__decorate([
    (0, common_1.Put)(':id/busy'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark agent as busy' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "markAgentBusy", null);
__decorate([
    (0, common_1.Put)(':id/error'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark agent as error' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "markAgentError", null);
__decorate([
    (0, common_1.Put)(':id/profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent profile (self-identification)' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, agent_dto_1.AgentProfileDto, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgentProfile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
exports.AgentController = AgentController = __decorate([
    (0, swagger_1.ApiTags)('Agents'),
    (0, common_1.Controller)('agents'),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.API),
    __metadata("design:paramtypes", [agent_service_1.AgentService,
        database_1.DatabaseService])
], AgentController);
//# sourceMappingURL=agent.controller.js.map