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
var DirectorAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectorAgentService = void 0;
const common_1 = require("@nestjs/common");
const mcp_broker_service_1 = require("./mcp-broker.service");
/**
 * Director Agent Service
 *
 * Main agent that coordinates all MCP operations and sub-agents.
 * Acts as the central orchestrator for all AI tasks.
 */
let DirectorAgentService = DirectorAgentService_1 = class DirectorAgentService {
    mcpBroker;
    logger = new common_1.Logger(DirectorAgentService_1.name);
    tasks = new Map();
    agents = new Set();
    constructor(mcpBroker) {
        this.mcpBroker = mcpBroker;
        // Register message handlers
        this.mcpBroker.registerHandler('command', this.handleCommand.bind(this));
        this.mcpBroker.registerHandler('response', this.handleResponse.bind(this));
        this.mcpBroker.registerHandler('error', this.handleError.bind(this));
    }
    /**
     * Handle command message
     */
    async handleCommand(message) {
        this.logger.debug(`Director received command: ${JSON.stringify(message)}`);
        // Create task from command
        const task = { id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: message.payload.action,
            status: 'pending',
            priority: message.metadata?.priority || 'medium', description: `Execute ${message.payload.action} on ${message.payload.server}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                ...message.metadata,
                originalMessageId: message.id,
                sender: message.sender
            }
        };
        // Store task
        this.tasks.set(task.id, task);
        // Process task
        await this.processTask(task);
    }
    /**
     * Handle response message
     */
    async handleResponse(message) {
        this.logger.debug(`Director received response: ${JSON.stringify(message)}`);
        // Find original task
        const originalMessageId = message.metadata?.correlationId;
        if (!originalMessageId) {
            this.logger.warn('Response message missing correlationId');
            return;
        }
        // Find task by original message ID
        const task = Array.from(this.tasks.values()).find(t => t.metadata?.originalMessageId === originalMessageId);
        if (!task) {
            this.logger.warn(`No task found for message ID: ${originalMessageId}`);
            return;
        }
        // Update task
        task.status = 'completed';
        task.result = message.payload.result;
        task.completedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        // Store updated task
        this.tasks.set(task.id, task);
        // Notify completion this.logger.log(`Task ${task.id} completed`);
    }
    /**
     * Handle error message
     */
    async handleError(message) {
        this.logger.debug(`Director received error: ${JSON.stringify(message)}`);
        // Find original task
        const originalMessageId = message.metadata?.correlationId;
        if (!originalMessageId) {
            this.logger.warn('Error message missing correlationId');
            return;
        }
        // Find task by original message ID
        const task = Array.from(this.tasks.values()).find(t => t.metadata?.originalMessageId === originalMessageId);
        if (!task) {
            this.logger.warn(`No task found for message ID: ${originalMessageId}`);
            return;
        }
        // Update task
        task.status = 'failed';
        task.error = message.payload.error;
        task.updatedAt = new Date().toISOString();
        // Store updated task
        this.tasks.set(task.id, task);
        // Notify failure this.logger.error(`Task ${task.id} failed: ${task.error}`);
    }
    /**
     * Process task
     */
    async processTask(task) {
        try {
            // Update task status
            task.status = 'in_progress';
            task.updatedAt = new Date().toISOString();
            this.tasks.set(task.id, task);
            // Get original message details
            const originalMessageId = task.metadata?.originalMessageId;
            const sender = task.metadata?.sender;
            if (!originalMessageId) {
                throw new Error('Task missing originalMessageId');
            }
            // Determine which agent should handle this task
            const assignedAgent = await this.assignTaskToAgent(task);
            if (assignedAgent) {
                task.assignedTo = assignedAgent;
                this.tasks.set(task.id, task);
                // Forward task to assigned agent
                // Implementation depends on how agents are integrated this.logger.log(`Task ${task.id} assigned to ${assignedAgent}`);
            }
            else {
                // Handle directly through MCP Broker
                const [serverName, action] = task.type.split('.');
                const params = task.metadata?.params || {};
                await this.mcpBroker.executeDirective(serverName, action, params, {
                    sender: 'director',
                    recipient: sender,
                    metadata: {
                        taskId: task.id,
                        originalMessageId
                    }
                });
            }
        }
        catch (error) {
            // Update task on error
            task.status = 'failed';
            task.error = error.message;
            task.updatedAt = new Date().toISOString();
            this.tasks.set(task.id, task);
            this.logger.error(`Failed to process task ${task.id}: ${error.message}`);
        }
    }
    /**
     * Assign task to appropriate agent
     */
    async assignTaskToAgent(task) {
        // This is a simplified implementation
        // In a real system, you would have logic to determine the best agent
        // based on capabilities, load, etc.
        // For now, return null to indicate the Director should handle it directly
        return null;
    }
    /**
     * Register a new agent
     */
    registerAgent(agentId, capabilities) {
        this.agents.add(agentId);
        this.logger.log(`Agent ${agentId} registered with capabilities: ${capabilities.join(', ')}`);
    }
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.logger.log(`Agent ${agentId} unregistered`);
    }
    /**
     * Get all tasks
     */
    getTasks(filter) {
        let tasks = Array.from(this.tasks.values());
        if (filter?.status) {
            tasks = tasks.filter(t => t.status === filter.status);
        }
        if (filter?.assignedTo) {
            tasks = tasks.filter(t => t.assignedTo === filter.assignedTo);
        }
        return tasks;
    }
    /**
     * Get task by ID
     */
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * Create a new task
     */
    async createTask(type, description, params = {}, options = {}) {
        const { priority = 'medium', metadata = {} } = options;
        // Create task
        const task = { id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            status: 'pending',
            priority,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                ...metadata,
                params
            }
        };
        // Store task
        this.tasks.set(task.id, task);
        // Process task
        await this.processTask(task);
        return task;
    }
};
exports.DirectorAgentService = DirectorAgentService;
exports.DirectorAgentService = DirectorAgentService = DirectorAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mcp_broker_service_1.MCPBrokerService])
], DirectorAgentService);
//# sourceMappingURL=director-agent.service.js.map