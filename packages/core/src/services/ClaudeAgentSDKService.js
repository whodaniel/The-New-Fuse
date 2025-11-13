"use strict";
/**
 * Claude Agent SDK Service
 *
 * Integrates the Anthropic Claude Agent SDK into The New Fuse Framework's
 * core orchestration layer. This service provides:
 *
 * - Agent lifecycle management with SDK
 * - Multi-agent coordination via SDK
 * - Protocol bridge integration (A2A, MCP, Pydantic)
 * - Enhanced error handling and retry logic
 * - Performance monitoring and metrics
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClaudeAgentSDKService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAgentSDKService = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("events");
const agent_protocol_bridge_1 = require("@the-new-fuse/agent-protocol-bridge");
/**
 * Claude Agent SDK Service
 *
 * Central service for managing Claude Agent SDK instances within
 * The New Fuse framework, providing seamless integration with
 * existing protocols and orchestration systems.
 */
let ClaudeAgentSDKService = ClaudeAgentSDKService_1 = class ClaudeAgentSDKService extends events_1.EventEmitter {
    a2aService;
    mcpClient;
    logger = new common_1.Logger(ClaudeAgentSDKService_1.name);
    agents = new Map();
    defaultAgentId;
    constructor(a2aService, mcpClient) {
        super();
        this.a2aService = a2aService;
        this.mcpClient = mcpClient;
    }
    async onModuleInit() {
        this.logger.log('🚀 Initializing Claude Agent SDK Service...');
        // Setup A2A message routing if available
        if (this.a2aService) {
            this.setupA2ARouting();
        }
        this.logger.log('✅ Claude Agent SDK Service initialized');
    }
    async onModuleDestroy() {
        this.logger.log('🛑 Shutting down Claude Agent SDK Service...');
        // Dispose all managed agents
        for (const agent of this.agents.values()) {
            await this.disposeAgent(agent.id);
        }
        this.agents.clear();
        this.removeAllListeners();
    }
    /**
     * Register a new Claude agent with the service
     */
    async registerAgent(config) {
        // Check if agent already exists
        if (this.agents.has(config.agentId)) {
            throw new Error(`Agent with ID ${config.agentId} already registered`);
        }
        this.logger.log(`📝 Registering Claude agent: ${config.agentName} (${config.agentId})`);
        // Inject MCP client if available and not provided
        if (!config.mcpClient && this.mcpClient) {
            config.mcpClient = this.mcpClient;
        }
        // Enable A2A if service is available
        if (config.enableA2A === undefined && this.a2aService) {
            config.enableA2A = true;
        }
        // Create adapter
        const adapter = new agent_protocol_bridge_1.ClaudeAgentSDKAdapter(config);
        // Setup event forwarding
        this.setupEventForwarding(adapter, config.agentId);
        const managedAgent = {
            id: config.agentId,
            name: config.agentName,
            adapter,
            config,
            status: 'idle',
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            createdAt: new Date()
        };
        this.agents.set(config.agentId, managedAgent);
        // Set as default if first agent
        if (!this.defaultAgentId) {
            this.defaultAgentId = config.agentId;
        }
        this.emit('agent:registered', managedAgent);
        this.logger.log(`✅ Agent registered: ${config.agentName}`);
        return managedAgent;
    }
    /**
     * Execute a query using a Claude agent
     */
    async execute(prompt, options = {}) {
        // Select agent
        const agent = this.selectAgent(options);
        if (!agent) {
            if (options.createIfNotExists) {
                // Auto-create default agent
                const newAgent = await this.registerAgent({
                    agentId: `auto-${Date.now()}`,
                    agentName: 'Auto-created Claude Agent',
                    model: 'claude-sonnet-4'
                });
                return this.executeWithAgent(newAgent, prompt, options);
            }
            throw new Error('No suitable Claude agent found and auto-creation disabled');
        }
        return this.executeWithAgent(agent, prompt, options);
    }
    /**
     * Execute with a specific agent
     */
    async executeWithAgent(agent, prompt, options) {
        const startTime = Date.now();
        try {
            // Update agent status
            agent.status = 'busy';
            agent.lastActiveAt = new Date();
            this.logger.debug(`🔄 Executing with agent: ${agent.name}`);
            // Route via A2A if requested
            if (options.routeViaA2A && this.a2aService) {
                return await this.executeViaA2A(agent, prompt, options);
            }
            // Direct execution
            const result = options.retryOnError
                ? await agent.adapter.executeWithRetry(prompt, options.context, options.maxRetries)
                : await agent.adapter.execute(prompt, options.context);
            // Update metrics
            agent.totalExecutions++;
            if (result.success) {
                agent.successfulExecutions++;
            }
            else {
                agent.failedExecutions++;
            }
            agent.lastExecutionTime = Date.now() - startTime;
            agent.status = 'idle';
            return result;
        }
        catch (error) {
            agent.status = 'error';
            agent.failedExecutions++;
            this.logger.error(`Execution failed for agent ${agent.name}`, error);
            return {
                success: false,
                response: '',
                error: {
                    message: error instanceof Error ? error.message : String(error),
                    code: 'EXECUTION_ERROR',
                    retryable: false
                }
            };
        }
    }
    /**
     * Execute via A2A protocol for multi-agent coordination
     */
    async executeViaA2A(agent, prompt, options) {
        if (!this.a2aService) {
            throw new Error('A2A service not available');
        }
        this.logger.debug(`📡 Routing execution via A2A protocol`);
        // Create A2A message
        const a2aMessage = {
            id: this.generateMessageId(),
            type: A2AMessageType.TASK_ASSIGNMENT,
            fromAgent: 'claude-sdk-service',
            toAgent: agent.id,
            priority: A2APriority.MEDIUM,
            payload: {
                prompt,
                context: options.context
            },
            timestamp: Date.now()
        };
        // Send via A2A (implementation depends on your A2A service)
        // For now, execute directly and convert to A2A format
        const result = await agent.adapter.execute(prompt, options.context);
        // Emit A2A event
        this.emit('a2a:message:sent', {
            agent: agent.id,
            message: agent.adapter.toA2AMessage(result, 'TASK_RESPONSE')
        });
        return result;
    }
    /**
     * Select appropriate agent based on options
     */
    selectAgent(options) {
        // Explicit agent ID
        if (options.agentId) {
            return this.agents.get(options.agentId);
        }
        // Find by name
        if (options.agentName) {
            return Array.from(this.agents.values()).find(a => a.name === options.agentName);
        }
        // Custom selector
        if (options.agentSelector) {
            return options.agentSelector(Array.from(this.agents.values()));
        }
        // Use default agent
        if (this.defaultAgentId) {
            return this.agents.get(this.defaultAgentId);
        }
        return undefined;
    }
    /**
     * Setup A2A routing for incoming messages
     */
    setupA2ARouting() {
        if (!this.a2aService)
            return;
        this.logger.log('📡 Setting up A2A message routing');
        // Subscribe to A2A messages for Claude agents
        // Implementation depends on your A2A service interface
        // This is a conceptual example:
        /*
        this.a2aService.on('message:received', async (message: A2AMessage) => {
          const agent = this.agents.get(message.recipientId);
          if (!agent) return;
    
          const prompt = agent.adapter.fromA2AMessage(message);
          const result = await agent.adapter.execute(prompt);
    
          // Send response back via A2A
          const responseMessage = agent.adapter.toA2AMessage(result, 'TASK_RESPONSE');
          responseMessage.recipientId = message.senderId;
          responseMessage.correlationId = message.id;
    
          this.a2aService.send(responseMessage);
        });
        */
    }
    /**
     * Setup event forwarding from adapter to service
     */
    setupEventForwarding(adapter, agentId) {
        adapter.on('execution:start', (data) => {
            this.emit('agent:execution:start', { ...data, agentId });
        });
        adapter.on('execution:complete', (data) => {
            this.emit('agent:execution:complete', { ...data, agentId });
        });
        adapter.on('execution:error', (data) => {
            this.emit('agent:execution:error', { ...data, agentId });
        });
    }
    /**
     * Dispose a managed agent
     */
    async disposeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        this.logger.log(`🗑️ Disposing agent: ${agent.name}`);
        agent.status = 'disposed';
        await agent.adapter.dispose();
        this.agents.delete(agentId);
        if (this.defaultAgentId === agentId) {
            // Set new default if available
            const remaining = Array.from(this.agents.keys());
            this.defaultAgentId = remaining.length > 0 ? remaining[0] : undefined;
        }
        this.emit('agent:disposed', { agentId, agentName: agent.name });
        return true;
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * List all managed agents
     */
    listAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get service statistics
     */
    getStatistics() {
        const agents = Array.from(this.agents.values());
        return {
            totalAgents: agents.length,
            activeAgents: agents.filter(a => a.status === 'busy').length,
            idleAgents: agents.filter(a => a.status === 'idle').length,
            errorAgents: agents.filter(a => a.status === 'error').length,
            totalExecutions: agents.reduce((sum, a) => sum + a.totalExecutions, 0),
            successfulExecutions: agents.reduce((sum, a) => sum + a.successfulExecutions, 0),
            failedExecutions: agents.reduce((sum, a) => sum + a.failedExecutions, 0),
            averageExecutionTime: this.calculateAverageExecutionTime(agents),
            defaultAgentId: this.defaultAgentId
        };
    }
    /**
     * Calculate average execution time across all agents
     */
    calculateAverageExecutionTime(agents) {
        const timesWithExecutions = agents
            .filter(a => a.lastExecutionTime !== undefined)
            .map(a => a.lastExecutionTime);
        if (timesWithExecutions.length === 0)
            return 0;
        return timesWithExecutions.reduce((sum, time) => sum + time, 0) / timesWithExecutions.length;
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `claude-sdk-service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Health check
     */
    async healthCheck() {
        const issues = [];
        if (this.agents.size === 0) {
            issues.push('No agents registered');
        }
        const errorAgents = Array.from(this.agents.values()).filter(a => a.status === 'error');
        if (errorAgents.length > 0) {
            issues.push(`${errorAgents.length} agents in error state`);
        }
        return {
            healthy: issues.length === 0,
            agents: this.agents.size,
            issues: issues.length > 0 ? issues : undefined
        };
    }
};
exports.ClaudeAgentSDKService = ClaudeAgentSDKService;
exports.ClaudeAgentSDKService = ClaudeAgentSDKService = ClaudeAgentSDKService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, Object])
], ClaudeAgentSDKService);
//# sourceMappingURL=ClaudeAgentSDKService.js.map