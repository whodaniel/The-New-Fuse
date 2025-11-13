"use strict";
/**
 * Claude Agent SDK Adapter for The New Fuse Framework
 *
 * Simplified adapter that integrates the Anthropic Claude Agent SDK (v0.1.5+)
 * with the existing protocol bridge architecture.
 *
 * This adapter provides:
 * - Claude SDK query execution
 * - A2A protocol message translation
 * - Basic tool integration
 * - Event-driven message handling
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
var ClaudeAgentSDKAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAgentSDKAdapter = void 0;
const claude_agent_sdk_1 = require("@anthropic-ai/claude-agent-sdk");
const common_1 = require("@nestjs/common");
const events_1 = require("events");
const src_1 = require("../../../a2a-core/src");
const prisma_enums_1 = require("../types/prisma-enums");
let ClaudeAgentSDKAdapter = ClaudeAgentSDKAdapter_1 = class ClaudeAgentSDKAdapter extends events_1.EventEmitter {
    logger = new common_1.Logger(ClaudeAgentSDKAdapter_1.name);
    config;
    tools = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.logger.log(`Initializing Claude Agent SDK Adapter for agent: ${config.agentId}`);
    }
    /**
     * Register a custom tool for Claude to use
     */
    registerTool(toolDef) {
        this.tools.set(toolDef.name, toolDef);
        this.logger.debug(`Registered tool: ${toolDef.name}`);
    }
    /**
     * Execute a query using the Claude Agent SDK
     */
    async executeQuery(prompt) {
        try {
            const options = {
                model: this.config.model,
                systemPrompt: this.config.systemPrompt,
                settingSources: this.config.settingSources,
            };
            this.logger.debug('Executing Claude SDK query with options:', options);
            const result = await (0, claude_agent_sdk_1.query)({
                prompt,
                options
            });
            this.logger.debug('Query executed successfully');
            return result;
        }
        catch (error) {
            this.logger.error(`Error sending message to Claude: ${error.message}`);
            throw error;
        }
    }
    /**
     * Translate A2A message to Claude SDK query
     */
    async handleA2AMessage(message) {
        const a2aMessage = message.payload;
        try {
            // Convert A2A message to Claude prompt
            const prompt = this.a2aMessageToPrompt(a2aMessage);
            // Execute query
            const result = await this.executeQuery(prompt);
            // Convert result back to A2A response
            return this.claudeResponseToA2A(a2aMessage, result, message);
        }
        catch (error) {
            this.logger.error(`Error handling Claude response: ${error.message}`);
            return this.createErrorResponse(a2aMessage, error, message);
        }
    }
    /**
     * Convert A2A message to Claude prompt
     */
    a2aMessageToPrompt(a2aMessage) {
        const parts = [];
        // Add message type context
        parts.push(`Task Type: ${a2aMessage.type}`);
        // Add sender/receiver context
        parts.push(`From Agent: ${a2aMessage.fromAgent}`);
        parts.push(`To Agent: ${a2aMessage.toAgent}`);
        // Add priority if relevant
        if (a2aMessage.priority !== src_1.A2APriority.MEDIUM) {
            parts.push(`Priority: ${a2aMessage.priority}`);
        }
        // Add the actual task/payload
        parts.push('\nTask:');
        if (typeof a2aMessage.payload === 'string') {
            parts.push(a2aMessage.payload);
        }
        else {
            parts.push(JSON.stringify(a2aMessage.payload, null, 2));
        }
        // Add metadata if present
        if (a2aMessage.metadata) {
            parts.push('\nContext:');
            parts.push(JSON.stringify(a2aMessage.metadata, null, 2));
        }
        return parts.join('\n');
    }
    /**
     * Convert Claude response to A2A message
     */
    claudeResponseToA2A(originalMessage, claudeResponse, originalProtocolMessage) {
        const responseMessage = {
            id: `claude-response-${Date.now()}`,
            fromAgent: this.config.agentId,
            toAgent: originalMessage.fromAgent,
            type: src_1.A2AMessageType.DATA_RESPONSE,
            payload: claudeResponse,
            priority: originalMessage.priority,
            timestamp: Date.now(),
            metadata: {
                correlationId: originalMessage.id,
                originalType: originalMessage.type,
                processedBy: 'claude-agent-sdk',
                processedAt: new Date().toISOString()
            }
        };
        return {
            id: `protocol-${responseMessage.id}`,
            type: src_1.A2AMessageType.DATA_RESPONSE,
            protocol: prisma_enums_1.ProtocolType.A2A_V1,
            payload: responseMessage,
            metadata: {
                ...originalProtocolMessage.metadata,
                translatedFrom: prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT,
                translatedAt: new Date().toISOString()
            },
            timestamp: new Date()
        };
    }
    /**
     * Create error response
     */
    createErrorResponse(originalMessage, error, originalProtocolMessage) {
        const errorMessage = {
            id: `claude-error-${Date.now()}`,
            fromAgent: this.config.agentId,
            toAgent: originalMessage.fromAgent,
            type: src_1.A2AMessageType.ERROR_NOTIFICATION,
            payload: {
                error: error instanceof Error ? error.message : String(error),
                originalMessageId: originalMessage.id,
                timestamp: new Date().toISOString()
            },
            priority: src_1.A2APriority.HIGH,
            timestamp: Date.now(),
            metadata: {
                correlationId: originalMessage.id,
                errorType: 'claude_sdk_error'
            }
        };
        return {
            id: `protocol-${errorMessage.id}`,
            type: src_1.A2AMessageType.ERROR_NOTIFICATION,
            protocol: prisma_enums_1.ProtocolType.A2A_V1,
            payload: errorMessage,
            metadata: {
                ...originalProtocolMessage.metadata,
                errorOccurred: true,
                errorAt: new Date().toISOString()
            },
            timestamp: new Date()
        };
    }
    /**
     * Get adapter status
     */
    getStatus() {
        return {
            agentId: this.config.agentId,
            agentName: this.config.agentName,
            toolsRegistered: this.tools.size,
            config: {
                model: this.config.model,
                systemPrompt: typeof this.config.systemPrompt === 'string' ? '[custom]' : this.config.systemPrompt,
                settingSources: this.config.settingSources
            }
        };
    }
    /**
     * Cleanup resources
     */
    async destroy() {
        this.tools.clear();
        this.removeAllListeners();
        this.logger.log(`Claude Agent SDK Adapter destroyed for agent: ${this.config.agentId}`);
    }
};
exports.ClaudeAgentSDKAdapter = ClaudeAgentSDKAdapter;
exports.ClaudeAgentSDKAdapter = ClaudeAgentSDKAdapter = ClaudeAgentSDKAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], ClaudeAgentSDKAdapter);
//# sourceMappingURL=ClaudeAgentSDKAdapter.js.map