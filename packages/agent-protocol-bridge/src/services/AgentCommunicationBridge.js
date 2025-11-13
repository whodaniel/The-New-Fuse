"use strict";
/**
 * AgentCommunicationBridge.ts
 *
 * Bridge service that connects AgentHub with A2A and MCP services.
 * Provides protocol translation, message routing, context preservation, and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCommunicationBridge = void 0;
const events_1 = require("events");
const ProtobufAdapter_1 = require("../adapters/ProtobufAdapter");
class AgentCommunicationBridge extends events_1.EventEmitter {
    a2aService;
    mcpClient;
    messageRouter;
    config;
    protobufAdapter;
    activeContexts = new Map();
    messageHistory = new Map();
    metrics;
    performanceStartTimes = new Map();
    constructor(a2aService, mcpClient, messageRouter, config = {
        enableA2A: true,
        enableMCP: true,
        enableRouting: true,
        defaultTimeout: 30000,
        maxRetries: 3,
        contextPreservation: true,
        performanceMonitoring: true,
    }) {
        super();
        this.a2aService = a2aService;
        this.mcpClient = mcpClient;
        this.messageRouter = messageRouter;
        this.config = config;
        this.protobufAdapter = new ProtobufAdapter_1.ProtobufAdapter();
        this.initializeMetrics();
        this.setupEventHandlers();
    }
    /**
     * Initialize metrics tracking
     */
    initializeMetrics() {
        this.metrics = {
            totalMessages: 0,
            successfulMessages: 0,
            failedMessages: 0,
            averageResponseTime: 0,
            protocolUsage: {},
            agentUsage: {},
            errorsByType: {},
        };
    }
    /**
     * Setup event handlers for underlying services
     */
    setupEventHandlers() {
        if (this.a2aService) {
            // Use explicit subscription APIs instead of relying on inherited EventEmitter
            this.a2aService.onMessageSent(this.handleA2AMessage.bind(this));
            this.a2aService.onAgentRegistered(this.handleA2AAgentRegistered.bind(this));
        }
        if (this.messageRouter) {
            this.messageRouter.on('message', this.handleRoutedMessage.bind(this));
            this.messageRouter.on('error', this.handleRoutingError.bind(this));
        }
    }
    /**
     * Send a task to an agent through the appropriate protocol
     */
    async sendTaskToAgent(agent, prompt, options = {}, context) {
        const startTime = Date.now();
        const messageId = this.generateMessageId();
        // Track the selected protocol for use in error handling and metrics
        let selectedProtocol = 'direct';
        try {
            // Store performance tracking
            if (this.config.performanceMonitoring) {
                this.performanceStartTimes.set(messageId, startTime);
            }
            // Preserve context if enabled
            if (this.config.contextPreservation && context) {
                this.activeContexts.set(messageId, context);
            }
            // Determine the best communication protocol
            selectedProtocol = this.selectProtocol(agent, options);
            // Translate the message for the target protocol
            const translationResult = await this.translateMessage(prompt, options, context, selectedProtocol);
            if (!translationResult.success) {
                throw new Error(`Message translation failed: ${translationResult.error});
      }

      // Send the message using the appropriate protocol
      let result: any;
      switch (selectedProtocol) {
        case 'a2a':
          result = await this.sendViaA2A(agent, translationResult.translatedMessage!, options, context);
          break;
        case 'mcp':
          result = await this.sendViaMCP(agent, translationResult.translatedMessage!, options, context);
          break;
        case 'direct':
          result = await this.sendDirect(agent, prompt, options, context);
          break;
        default:`);
                throw new Error(`Unsupported protocol: ${selectedProtocol}`);
            }
            // Record successful message
            await this.recordMessage(messageId, agent.id, 'bridge', prompt, selectedProtocol, true);
            this.updateMetrics(messageId, selectedProtocol, agent.id, true, startTime);
            this.emit('messageSent', {
                messageId,
                agentId: agent.id,
                protocol: selectedProtocol,
                success: true,
                responseTime: Date.now() - startTime,
            });
            return result;
        }
        catch (error) {
            // Record failed message using the actual selected protocol instead of hard-coded 'direct'
            await this.recordMessage(messageId, agent.id, 'bridge', prompt, selectedProtocol, false, error instanceof Error ? error.message : String(error));
            this.updateMetrics(messageId, selectedProtocol, agent.id, false, startTime);
            this.emit('messageError', {
                messageId,
                agentId: agent.id,
                error: error instanceof Error ? error.message : String(error),
                responseTime: Date.now() - startTime,
            });
            throw error;
        }
        finally {
            // Cleanup
            this.performanceStartTimes.delete(messageId);
            if (context?.conversationId !== undefined) {
                // Keep context for conversation continuation
            }
            else {
                this.activeContexts.delete(messageId);
            }
        }
    }
    /**
     * Select the best communication protocol for an agent
     */
    selectProtocol(agent, options) {
        // Prefer A2A if enabled and agent supports it
        if (this.config.enableA2A && this.a2aService && agent.configuration.a2aEnabled) {
            return 'a2a';
        }
        // Fallback to MCP if enabled and agent supports it
        if (this.config.enableMCP && this.mcpClient && agent.configuration.mcpEnabled) {
            return 'mcp';
        }
        // Use direct communication as last resort
        return 'direct';
    }
    /**
     * Translate message for target protocol
     */
    async translateMessage(prompt, options, context, targetProtocol = 'direct') {
        try {
            let translatedMessage;
            switch (targetProtocol) {
                case 'a2a':
                    translatedMessage = this.translateToA2A(prompt, options, context);
                    break;
                case 'mcp':
                    translatedMessage = this.translateToMCP(prompt, options, context);
                    break;
                case 'direct':
                    translatedMessage = this.translateToDirect(prompt, options, context);
                    break;
                default:
                    throw new Error(Unsupported, target, protocol, $, { targetProtocol });
            }
            return {
                success: true,
                translatedMessage,
                targetProtocol,
                metadata: {
                    originalPrompt: prompt,
                    translationTime: Date.now(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                targetProtocol,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Translate message to A2A format
     */
    translateToA2A(prompt, options, context) {
        return {
            type: 'request',
            payload: {
                action: 'execute_task',
                prompt,
                context: options.context,
                timeout: options.timeout || this.config.defaultTimeout,
                metadata: {
                    conversationId: context?.conversationId,
                    sessionId: context?.sessionId,
                    userId: context?.userId,
                    workspaceId: context?.workspaceId,
                    ...context?.metadata,
                },
            },
            priority: this.determinePriority(options),
            ttl: options.timeout || this.config.defaultTimeout,
        };
    }
    /**
     * Translate message to MCP format
     */
    translateToMCP(prompt, options, context) {
        // MCP protocol translation - placeholder implementation
        return {
            method: 'execute',
            params: {
                prompt,
                context: options.context,
                timeout: options.timeout || this.config.defaultTimeout,
                metadata: context?.metadata,
            },
        };
    }
    /**
     * Translate message to direct format
     */
    translateToDirect(prompt, options, context) {
        return {
            prompt,
            options,
            context: {
                ...options.context,
                communicationContext: context,
            },
        };
    }
    /**
     * Determine message priority based on options
     */
    determinePriority(options) {
        if (options.timeout && options.timeout < 5000)
            return 'urgent';
        if (options.maxRetries && options.maxRetries > 3)
            return 'high';
        return 'normal';
    }
    /**
     * Send message via A2A service
     */
    async sendViaA2A(agent, message, options, context) {
        if (!this.a2aService) {
            throw new Error('A2A service not available');
        }
        // Find A2A agent
        const a2aAgent = await this.a2aService.findAgentByName(agent.name);
        if (!a2aAgent) {
            `
      throw new Error(Agent ${agent.name}`;
            not;
            registered;
            with (A2A)
                service;
            ;
        }
        // Send message
        const result = await this.a2aService.sendMessage('bridge', a2aAgent.id, message);
        // For real implementation, you would wait for response or implement async handling
        return {
            messageId: result.id,
            status: 'sent',
            protocol: 'a2a',
            timestamp: new Date(),
        };
    }
    /**
     * Send message via MCP client
     */
    async sendViaMCP(agent, message, options, context) {
        if (!this.mcpClient) {
            throw new Error('MCP client not available');
        }
        try {
            // Check if call method is available on mcpClient
            if (this.mcpClient.call) {
                const result = await this.mcpClient.call('tools/execute', {
                    tool: agent.configuration?.command || agent.command,
                    parameters: message.params || message,
                });
                return {
                    status: 'executed',
                    protocol: 'mcp',
                    timestamp: new Date(),
                    result: result?.content,
                    messageId: this.generateId('mcp'),
                };
            }
            else {
                // Fallback when call method is not available
                console.warn('MCPClient.call method not available, using placeholder');
                return {
                    status: 'sent',
                    protocol: 'mcp',
                    timestamp: new Date(),
                    message: Task, sent, to, $
                };
                {
                    agent.name;
                }
                via;
                MCP(fallback, mode),
                ;
            }
            as;
            BridgeSendFallback;
        }
        finally { }
        `
    } catch (error) {`;
        // Fallback to placeholder if MCP API is not stabilized
        console.warn(MCP, execution, failed);
        for (agent; $; { agent, : .name } `:, error);
      return {
        status: 'sent',
        protocol: 'mcp',
        timestamp: new Date(),
        message: Task sent to ${agent.name} via MCP (placeholder mode),
        error: error instanceof Error ? error.message : String(error),
      } as BridgeSendError;
    }
  }

  /**
   * Send message directly
   */
  private async sendDirect(
    agent: AgentConfiguration,
    prompt: string,
    options: TaskExecutionOptions,
    context?: CommunicationContext
  ): Promise<BridgeSendResult> {
    // Direct communication placeholder
    return {
      status: 'sent',`)
            protocol: 'direct', `
      timestamp: new Date(),
      message: Task sent to ${agent.name} directly`,
            ;
    }
}
exports.AgentCommunicationBridge = AgentCommunicationBridge;
as;
BridgeSendSuccess;
handleA2AMessage(event, any);
void {
    this: .emit('a2aMessage', event),
    // Update metrics
    this: .metrics.protocolUsage['a2a'] = (this.metrics.protocolUsage['a2a'] || 0) + 1
};
handleA2AAgentRegistered(event, any);
void {
    this: .emit('a2aAgentRegistered', event)
};
handleRoutedMessage(message, any);
void {
    this: .emit('routedMessage', message),
    // Update metrics
    this: .metrics.protocolUsage['routing'] = (this.metrics.protocolUsage['routing'] || 0) + 1
};
handleRoutingError(error, any);
void {
    this: .emit('routingError', error),
    // Update error metrics
    this: .metrics.errorsByType['routing'] = (this.metrics.errorsByType['routing'] || 0) + 1
};
async;
recordMessage(messageId, string, toAgent, string, fromAgent, string, content, any, protocol, 'a2a' | 'mcp' | 'direct', success, boolean, error ?  : string);
Promise < void  > {
    const: entry, MessageHistoryEntry = {
        id: messageId,
        timestamp: new Date(),
        fromAgent,
        toAgent,
        content,
        protocol,
        success,
        error,
    },
    this: .messageHistory.set(messageId, entry),
    // Emit event for external logging
    this: .emit('messageRecorded', entry),
    : .messageHistory.size > 10000
};
{
    const entries = Array.from(this.messageHistory.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
    // Remove oldest 1000 entries
    for (let i = 0; i < 1000; i++) {
        this.messageHistory.delete(entries[i][0]);
    }
}
updateMetrics(messageId, string, protocol, string, agentId, string, success, boolean, startTime, number);
void {
    const: responseTime = Date.now() - startTime,
    this: .metrics.totalMessages++,
    if(success) {
        this.metrics.successfulMessages++;
    }, else: {
        this: .metrics.failedMessages++
    }
    // Update average response time
    ,
    // Update average response time
    const: totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalMessages - 1) + responseTime,
    this: .metrics.averageResponseTime = totalResponseTime / this.metrics.totalMessages,
    // Update protocol usage
    this: .metrics.protocolUsage[protocol] = (this.metrics.protocolUsage[protocol] || 0) + 1,
    // Update agent usage
    this: .metrics.agentUsage[agentId] = (this.metrics.agentUsage[agentId] || 0) + 1
};
/**
 * Get communication context
 */
getContext(messageId, string);
CommunicationContext | undefined;
{
    return this.activeContexts.get(messageId);
}
/**
 * Create new communication context
 */
createContext(context, (Partial));
CommunicationContext;
{
    const newContext = {
        conversationId: context.conversationId || this.generateId('conv'),
        sessionId: context.sessionId || this.generateId('session'),
        userId: context.userId,
        workspaceId: context.workspaceId,
        metadata: context.metadata || {},
        history: context.history || [],
    };
    return newContext;
}
/**
 * Get message history
 */
getMessageHistory(limit ?  : number, filter ?  : {
    agentId: string,
    protocol: string,
    success: boolean,
    after: Date
});
MessageHistoryEntry[];
{
    let entries = Array.from(this.messageHistory.values());
    // Apply filters
    if (filter) {
        if (filter.agentId) {
            entries = entries.filter(e => e.toAgent === filter.agentId || e.fromAgent === filter.agentId);
        }
        if (filter.protocol) {
            entries = entries.filter(e => e.protocol === filter.protocol);
        }
        if (filter.success !== undefined) {
            entries = entries.filter(e => e.success === filter.success);
        }
        if (filter.after) {
            entries = entries.filter(e => e.timestamp > filter.after);
        }
    }
    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    // Apply limit
    if (limit) {
        entries = entries.slice(0, limit);
    }
    return entries;
}
/**
 * Get communication metrics
 */
getMetrics();
CommunicationMetrics;
{
    return { ...this.metrics };
}
/**
 * Reset metrics
 */
resetMetrics();
void {
    this: .initializeMetrics(),
    this: .emit('metricsReset')
};
/**
 * Test connection to an agent
 */
async;
testConnection(agent, AgentHub_1.AgentConfiguration);
Promise < {
    success: boolean,
    responseTime: number,
    protocol: string,
    error: string
} > {
    const: startTime = Date.now(),
    const: protocol = this.selectProtocol(agent, {}),
    try: {
        // Send a simple ping message
        await, this: .sendTaskToAgent(agent, 'ping', { timeout: 5000 }),
        return: {
            success: true,
            responseTime: Date.now() - startTime,
            protocol,
        }
    }, catch(error) {
        return {
            success: false,
            responseTime: Date.now() - startTime,
            protocol,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
generateMessageId();
string;
{
    return this.generateId('msg');
}
generateId(prefix, string);
string;
{
    return $;
    {
        prefix;
    }
    _$;
    {
        Date.now();
    }
    `_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Clean up resources
 */
async;
cleanup();
Promise < void  > {
    this: .activeContexts.clear(),
    this: .messageHistory.clear(),
    this: .performanceStartTimes.clear(),
    this: .initializeMetrics(),
    this: .emit('cleanup')
};
exports.default = AgentCommunicationBridge;
//# sourceMappingURL=AgentCommunicationBridge.js.map