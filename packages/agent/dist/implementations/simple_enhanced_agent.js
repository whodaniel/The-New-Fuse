"use strict";
/**
 * Simple Enhanced Agent - Lightweight enhanced agent
 *
 * A simpler version of the enhanced agent for:
 * - Quick deployment
 * - Lower resource usage
 * - Basic chat and tool capabilities
 * - Minimal configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEnhancedAgent = void 0;
exports.createSimpleAgent = createSimpleAgent;
const events_1 = require("events");
// ============================================================
// SIMPLE ENHANCED AGENT
// ============================================================
class SimpleEnhancedAgent extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.history = [];
        this.isActive = false;
        this.config = config;
        this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
        this.maxHistory = config.maxHistory || 50;
    }
    /**
     * Start the agent
     */
    start() {
        this.isActive = true;
        // Add system message
        if (this.history.length === 0) {
            this.history.push({
                role: 'system',
                content: this.systemPrompt,
                timestamp: new Date(),
            });
        }
        this.emit('started');
    }
    /**
     * Stop the agent
     */
    stop() {
        this.isActive = false;
        this.emit('stopped');
    }
    /**
     * Check if active
     */
    isRunning() {
        return this.isActive;
    }
    /**
     * Send a message and get response
     */
    async chat(userMessage) {
        if (!this.isActive) {
            throw new Error('Agent is not active');
        }
        // Add user message
        this.history.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        });
        try {
            // Check for tool invocations
            const toolResults = await this.checkToolInvocations(userMessage);
            // Generate response (simulated)
            const responseContent = this.generateResponse(userMessage, toolResults);
            // Add assistant message
            this.history.push({
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
            });
            // Trim history if needed
            this.trimHistory();
            const response = {
                content: responseContent,
            };
            if (toolResults.length > 0) {
                response.toolResults = toolResults;
            }
            this.emit('response', response);
            return response;
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Check for tool invocations in the message
     */
    async checkToolInvocations(message) {
        if (!this.config.tools?.length) {
            return [];
        }
        const results = [];
        const lowerMessage = message.toLowerCase();
        for (const tool of this.config.tools) {
            // Simple keyword matching (in production, use LLM for tool selection)
            if (lowerMessage.includes(tool.name.toLowerCase())) {
                try {
                    const result = await tool.execute({});
                    results.push({ tool: tool.name, result });
                    this.emit('tool:executed', { tool: tool.name, result });
                }
                catch (error) {
                    this.emit('tool:error', { tool: tool.name, error });
                }
            }
        }
        return results;
    }
    /**
     * Generate a response (simulated)
     */
    generateResponse(userMessage, toolResults) {
        let response = '';
        if (toolResults.length > 0) {
            response += 'I used the following tools:\n';
            for (const tr of toolResults) {
                response += `- ${tr.tool}: ${JSON.stringify(tr.result)}\n`;
            }
            response += '\n';
        }
        // Simple response generation
        if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
            response += `Hello! I'm ${this.config.name}. How can I help you today?`;
        }
        else if (userMessage.toLowerCase().includes('help')) {
            response += `I can help you with various tasks. `;
            if (this.config.tools?.length) {
                response += `I have access to these tools: ${this.config.tools.map((t) => t.name).join(', ')}.`;
            }
        }
        else {
            response += `I understand you're asking about: "${userMessage.slice(0, 100)}". `;
            response += `I'll do my best to assist you.`;
        }
        return response;
    }
    /**
     * Trim history to max size
     */
    trimHistory() {
        if (this.history.length > this.maxHistory) {
            // Keep system message and recent messages
            const systemMessages = this.history.filter((m) => m.role === 'system');
            const recentMessages = this.history.slice(-this.maxHistory + systemMessages.length);
            this.history = [...systemMessages, ...recentMessages];
        }
    }
    /**
     * Get chat history
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [
            {
                role: 'system',
                content: this.systemPrompt,
                timestamp: new Date(),
            },
        ];
        this.emit('history:cleared');
    }
    /**
     * Set system prompt
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        // Update system message in history
        const sysIndex = this.history.findIndex((m) => m.role === 'system');
        if (sysIndex !== -1) {
            this.history[sysIndex].content = prompt;
        }
    }
    /**
     * Add a tool
     */
    addTool(tool) {
        if (!this.config.tools) {
            this.config.tools = [];
        }
        this.config.tools.push(tool);
        this.emit('tool:added', { name: tool.name });
    }
    /**
     * Remove a tool
     */
    removeTool(name) {
        if (this.config.tools) {
            const index = this.config.tools.findIndex((t) => t.name === name);
            if (index !== -1) {
                this.config.tools.splice(index, 1);
                this.emit('tool:removed', { name });
            }
        }
    }
    /**
     * Get available tools
     */
    getTools() {
        return this.config.tools || [];
    }
    /**
     * Get agent info
     */
    getInfo() {
        return {
            id: this.config.id,
            name: this.config.name,
            model: this.config.model || 'default',
            isActive: this.isActive,
            historyLength: this.history.length,
            toolCount: this.config.tools?.length || 0,
        };
    }
}
exports.SimpleEnhancedAgent = SimpleEnhancedAgent;
// ============================================================
// FACTORY
// ============================================================
function createSimpleAgent(id, name, options = {}) {
    return new SimpleEnhancedAgent({
        id,
        name,
        ...options,
    });
}
exports.default = SimpleEnhancedAgent;
//# sourceMappingURL=simple_enhanced_agent.js.map