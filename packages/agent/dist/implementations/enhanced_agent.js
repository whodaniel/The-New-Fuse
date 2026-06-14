"use strict";
/**
 * Enhanced Agent - Advanced agent with full capabilities
 *
 * An enhanced agent implementation that provides:
 * - Multi-model LLM support
 * - Context management
 * - Tool integration
 * - Memory systems
 * - Learning capabilities
 * - Self-improvement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedAgent = void 0;
exports.createEnhancedAgent = createEnhancedAgent;
const events_1 = require("events");
class EnhancedAgent extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.contexts = new Map();
        this.shortTermMemory = [];
        this.isRunning = false;
        this.config = config;
        this.metrics = {
            requestsProcessed: 0,
            tokensUsed: 0,
            averageLatency: 0,
            toolsInvoked: 0,
            errors: 0,
        };
    }
    // ============================================================
    // LIFECYCLE
    // ============================================================
    /**
     * Start the agent
     */
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.emit('started');
    }
    /**
     * Stop the agent
     */
    async stop() {
        this.isRunning = false;
        this.emit('stopped');
    }
    /**
     * Get agent status
     */
    getStatus() {
        return {
            id: this.config.id,
            name: this.config.name,
            running: this.isRunning,
            capabilities: this.config.capabilities,
            metrics: this.metrics,
        };
    }
    // ============================================================
    // CONVERSATION
    // ============================================================
    /**
     * Process a user message
     */
    async processMessage(conversationId, message, options = {}) {
        const startTime = Date.now();
        // Get or create context
        let context = this.contexts.get(conversationId);
        if (!context) {
            context = this.createContext(conversationId);
        }
        // Add user message
        context.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date(),
        });
        try {
            // Select model
            const model = this.selectModel(options.model);
            // Build prompt with context
            const prompt = this.buildPrompt(context, options.systemPrompt);
            // Get available tools
            const tools = this.getTools(options.tools);
            // Simulate LLM call (in production, call actual API)
            const response = await this.callModel(model, prompt, tools);
            // Handle tool calls
            if (response.toolCalls?.length) {
                for (const toolCall of response.toolCalls) {
                    const result = await this.executeTool(toolCall);
                    context.messages.push({
                        role: 'tool',
                        content: JSON.stringify(result),
                        name: toolCall.name,
                        toolCallId: toolCall.id,
                        timestamp: new Date(),
                    });
                    this.metrics.toolsInvoked++;
                }
            }
            // Add assistant response
            context.messages.push({
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
            });
            // Update metrics
            const latency = Date.now() - startTime;
            this.metrics.requestsProcessed++;
            this.metrics.tokensUsed += response.metadata.tokens.input + response.metadata.tokens.output;
            this.metrics.averageLatency =
                (this.metrics.averageLatency * (this.metrics.requestsProcessed - 1) + latency) /
                    this.metrics.requestsProcessed;
            // Memory management
            this.manageMemory(context);
            this.emit('response', { conversationId, response });
            return response;
        }
        catch (error) {
            this.metrics.errors++;
            this.emit('error', { conversationId, error });
            throw error;
        }
    }
    /**
     * Create a new context
     */
    createContext(conversationId) {
        const context = {
            conversationId,
            messages: [],
            variables: {},
            metadata: { createdAt: new Date() },
        };
        this.contexts.set(conversationId, context);
        return context;
    }
    /**
     * Get context
     */
    getContext(conversationId) {
        return this.contexts.get(conversationId);
    }
    /**
     * Clear context
     */
    clearContext(conversationId) {
        this.contexts.delete(conversationId);
    }
    // ============================================================
    // MODEL MANAGEMENT
    // ============================================================
    /**
     * Select the best model for the task
     */
    selectModel(preferredModel) {
        if (preferredModel) {
            const model = this.config.models.find((m) => m.id === preferredModel || m.model === preferredModel);
            if (model)
                return model;
        }
        // Return highest priority model
        return this.config.models.sort((a, b) => b.priority - a.priority)[0];
    }
    /**
     * Build prompt with context
     */
    buildPrompt(context, systemPrompt) {
        const parts = [];
        if (systemPrompt) {
            parts.push(`System: ${systemPrompt}\n`);
        }
        // Add recent messages
        const recentMessages = context.messages.slice(-20);
        for (const msg of recentMessages) {
            parts.push(`${msg.role}: ${msg.content}`);
        }
        return parts.join('\n');
    }
    /**
     * Call model (simulated)
     */
    async callModel(model, prompt, tools) {
        // Simulate API latency
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Simulated response
        return {
            content: `Response from ${model.model} based on: ${prompt.slice(0, 100)}...`,
            metadata: {
                model: model.model,
                tokens: {
                    input: Math.floor(prompt.length / 4),
                    output: 50,
                },
                latency: 100,
            },
        };
    }
    // ============================================================
    // TOOL MANAGEMENT
    // ============================================================
    /**
     * Get available tools
     */
    getTools(filterIds) {
        if (filterIds) {
            return this.config.tools.filter((t) => filterIds.includes(t.id));
        }
        return this.config.tools;
    }
    /**
     * Execute a tool
     */
    async executeTool(toolCall) {
        const tool = this.config.tools.find((t) => t.name === toolCall.name);
        if (!tool) {
            throw new Error(`Tool not found: ${toolCall.name}`);
        }
        this.emit('tool:executing', toolCall);
        const result = await tool.handler(toolCall.arguments);
        this.emit('tool:executed', { toolCall, result });
        return result;
    }
    /**
     * Register a tool
     */
    registerTool(tool) {
        this.config.tools.push(tool);
        this.emit('tool:registered', tool);
    }
    /**
     * Unregister a tool
     */
    unregisterTool(toolId) {
        const index = this.config.tools.findIndex((t) => t.id === toolId);
        if (index !== -1) {
            this.config.tools.splice(index, 1);
            this.emit('tool:unregistered', { toolId });
        }
    }
    // ============================================================
    // MEMORY MANAGEMENT
    // ============================================================
    /**
     * Manage memory for a context
     */
    manageMemory(context) {
        // Trim messages if too many
        if (context.messages.length > this.config.memory.shortTermSize) {
            // Summarize older messages (in production, call LLM for summarization)
            const toSummarize = context.messages.slice(0, -this.config.memory.shortTermSize / 2);
            const summary = `[Summary of ${toSummarize.length} messages]`;
            // Keep recent messages plus summary
            context.messages = [
                { role: 'system', content: summary, timestamp: new Date() },
                ...context.messages.slice(-this.config.memory.shortTermSize / 2),
            ];
        }
        // Add to short-term memory
        const lastMessage = context.messages[context.messages.length - 1];
        if (lastMessage) {
            this.shortTermMemory.push(lastMessage);
            // Trim short-term memory
            if (this.shortTermMemory.length > this.config.memory.shortTermSize * 2) {
                this.shortTermMemory = this.shortTermMemory.slice(-this.config.memory.shortTermSize);
            }
        }
    }
    /**
     * Search memory
     */
    searchMemory(query, limit = 10) {
        // Simple keyword search (in production, use vector search)
        const queryLower = query.toLowerCase();
        return this.shortTermMemory
            .filter((m) => m.content.toLowerCase().includes(queryLower))
            .slice(-limit);
    }
    // ============================================================
    // LEARNING
    // ============================================================
    /**
     * Learn from feedback
     */
    async learnFromFeedback(conversationId, messageIndex, feedback, correction) {
        if (!this.config.learningEnabled)
            return;
        const context = this.contexts.get(conversationId);
        if (!context)
            return;
        const message = context.messages[messageIndex];
        if (!message)
            return;
        this.emit('learning:feedback', {
            conversationId,
            messageIndex,
            feedback,
            correction,
            originalContent: message.content,
        });
        // In production: Store feedback for fine-tuning, update prompts, etc.
    }
    // ============================================================
    // CAPABILITIES
    // ============================================================
    /**
     * Get capabilities
     */
    getCapabilities() {
        return [...this.config.capabilities];
    }
    /**
     * Check if has capability
     */
    hasCapability(capability) {
        return this.config.capabilities.includes(capability);
    }
    /**
     * Add capability
     */
    addCapability(capability) {
        if (!this.config.capabilities.includes(capability)) {
            this.config.capabilities.push(capability);
            this.emit('capability:added', { capability });
        }
    }
}
exports.EnhancedAgent = EnhancedAgent;
// ============================================================
// FACTORY
// ============================================================
function createEnhancedAgent(id, name, options = {}) {
    const config = {
        id,
        name,
        capabilities: options.capabilities || ['chat', 'tools', 'memory'],
        models: options.models || [
            {
                id: 'default',
                provider: 'openai',
                model: 'gpt-4',
                contextWindow: 128000,
                capabilities: ['chat', 'tools'],
                priority: 1,
            },
        ],
        tools: options.tools || [],
        memory: options.memory || {
            shortTermSize: 100,
            longTermEnabled: false,
            summarizationInterval: 50,
        },
        learningEnabled: options.learningEnabled ?? false,
    };
    return new EnhancedAgent(config);
}
exports.default = EnhancedAgent;
//# sourceMappingURL=enhanced_agent.js.map