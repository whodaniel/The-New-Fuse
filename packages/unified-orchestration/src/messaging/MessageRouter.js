"use strict";
/**
 * Message Router for Unified Orchestration
 *
 * This module provides intelligent routing of messages across different protocols
 * and agent systems, with load balancing, failover, and performance optimization.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const eventemitter3_1 = require("eventemitter3");
const p_queue_1 = __importDefault(require("p-queue"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('tnf:message-router');
class MessageRouter extends eventemitter3_1.EventEmitter {
    config;
    agentRegistry;
    routingRules = new Map();
    messageQueue;
    metrics;
    protocolAdapters = new Map();
    legacyMappings;
    messageCache = new Map();
    constructor(config, agentRegistry, // UnifiedAgentRegistry
    legacyMappings) {
        super();
        this.config = config;
        this.agentRegistry = agentRegistry;
        this.legacyMappings = legacyMappings;
        this.messageQueue = new p_queue_1.default({
            concurrency: config.performance.maxConcurrentMessages,
            interval: 100,
            intervalCap: config.performance.maxConcurrentMessages
        });
        this.metrics = {
            messagesRouted: 0,
            messagesFailed: 0,
            averageLatency: 0,
            protocolStats: this.initializeProtocolStats(),
            routingRuleStats: {}
        };
        this.setupDefaultRoutingRules();
        this.startMetricsReporting();
    }
    /**
     * Add a custom routing rule
     */
    addRoutingRule(rule) {
        this.routingRules.set(rule.id, rule);
        this.metrics.routingRuleStats[rule.id] = {
            applied: 0,
            successful: 0,
            failed: 0
        };
        debug('Added routing rule: %s', rule.name);
    }
    /**
     * Remove a routing rule
     */
    removeRoutingRule(ruleId) {
        const removed = this.routingRules.delete(ruleId);
        if (removed) {
            delete this.metrics.routingRuleStats[ruleId];
            debug('Removed routing rule: %s', ruleId);
        }
        return removed;
    }
    /**
     * Route a message through the system
     */
    async routeMessage(envelope) {
        const startTime = Date.now();
        try {
            this.emit('message:received', envelope);
            // Validate message
            await this.validateMessage(envelope.message);
            // Check cache for duplicate prevention
            if (this.isMessageCached(envelope.message)) {
                debug('Dropping duplicate message: %s', envelope.message.id);
                return;
            }
            // Cache message if enabled
            if (this.config.performance.enableCaching) {
                this.cacheMessage(envelope.message);
            }
            // Apply routing rules
            const applicableRules = this.getApplicableRules(envelope.message);
            if (applicableRules.length === 0) {
                // Default routing logic
                await this.performDefaultRouting(envelope);
            }
            else {
                // Apply rules in priority order
                for (const rule of applicableRules.sort((a, b) => (b.action.priority || 0) - (a.action.priority || 0))) {
                    await this.applyRoutingRule(rule, envelope);
                }
            }
            // Update metrics
            this.metrics.messagesRouted++;
            const latency = Date.now() - startTime;
            this.updateAverageLatency(latency);
        }
        catch (error) {
            this.metrics.messagesFailed++;
            this.emit('message:failed', envelope, error);
            debug('Failed to route message %s: %o', envelope.message.id, error);
            throw error;
        }
    }
    /**
     * Route multiple messages as a batch
     */
    async routeBatch(batch) {
        debug('Routing message batch: %s (%d messages)', batch.batchId, batch.messages.length);
        if (batch.metadata?.batchType === 'transaction') {
            // All messages must succeed or all fail
            await this.routeTransactionBatch(batch);
        }
        else if (batch.metadata?.batchType === 'sequential') {
            // Route messages in sequence
            for (const message of batch.messages) {
                const envelope = {
                    message,
                    transport: { protocol: message.protocol }
                };
                await this.routeMessage(envelope);
            }
        }
        else {
            // Route messages in parallel (default)
            await Promise.all(batch.messages.map(message => {
                const envelope = {
                    message,
                    transport: { protocol: message.protocol }
                };
                return this.messageQueue.add(() => this.routeMessage(envelope));
            }));
        }
    }
    /**
     * Get routing metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Clear routing metrics
     */
    clearMetrics() {
        this.metrics = {
            messagesRouted: 0,
            messagesFailed: 0,
            averageLatency: 0,
            protocolStats: this.initializeProtocolStats(),
            routingRuleStats: Object.fromEntries(Array.from(this.routingRules.keys()).map(id => [id, { applied: 0, successful: 0, failed: 0 }]))
        };
    }
    /**
     * Register a protocol adapter
     */
    registerProtocolAdapter(protocol, adapter) {
        this.protocolAdapters.set(protocol, adapter);
        debug('Registered protocol adapter for: %s', protocol);
    }
    /**
     * Convert legacy message format to unified format
     */
    convertLegacyMessage(legacyMessage, sourceFormat) {
        if (!this.legacyMappings) {
            throw new Error('Legacy message mappings not configured');
        }
        // Determine which legacy format this is
        let converter;
        // Check CLI formats
        if (this.legacyMappings.cliFormats[sourceFormat]) {
            converter = this.legacyMappings.cliFormats[sourceFormat].toUnified;
        }
        // Check workflow formats
        else if (this.legacyMappings.workflowFormats[sourceFormat]) {
            converter = this.legacyMappings.workflowFormats[sourceFormat].toUnified;
        }
        // Check sync formats
        else if (this.legacyMappings.syncFormats[sourceFormat]) {
            converter = this.legacyMappings.syncFormats[sourceFormat].toUnified;
        }
        // Check task formats
        else if (this.legacyMappings.taskFormats[sourceFormat]) {
            converter = this.legacyMappings.taskFormats[sourceFormat].toUnified;
        }
        if (!converter) {
            throw new Error(`Unknown legacy message format: ${sourceFormat});
    }

    return converter(legacyMessage);
  }

  /**
   * Convert unified message to legacy format
   */
  convertToLegacyMessage(unifiedMessage: UnifiedMessage, targetFormat: string): any {
    if (!this.legacyMappings) {
      throw new Error('Legacy message mappings not configured');
    }

    // Determine target format converter
    let converter: ((msg: UnifiedMessage) => any) | undefined;

    // Check CLI formats
    if (this.legacyMappings.cliFormats[targetFormat]) {
      converter = this.legacyMappings.cliFormats[targetFormat].fromUnified;
    }
    // Check workflow formats
    else if (this.legacyMappings.workflowFormats[targetFormat]) {
      converter = this.legacyMappings.workflowFormats[targetFormat].fromUnified;
    }
    // Check sync formats
    else if (this.legacyMappings.syncFormats[targetFormat]) {
      converter = this.legacyMappings.syncFormats[targetFormat].fromUnified;
    }
    // Check task formats
    else if (this.legacyMappings.taskFormats[targetFormat]) {
      converter = this.legacyMappings.taskFormats[targetFormat].fromUnified;
    }

    if (!converter) {`);
            throw new Error(`Unknown target format: ${targetFormat}`);
        }
        return converter(unifiedMessage);
    }
    async validateMessage(message) {
        // Basic validation
        if (!message.id || !message.type || !message.from.agentId) {
            throw new Error('Invalid message: missing required fields');
        }
        // Size validation
        const messageSize = JSON.stringify(message).length;
        if (messageSize > this.config.limits.maxMessageSize) {
            throw new Error(Message, too, large, $, { messageSize }, bytes > $, { this: .config.limits.maxMessageSize }, bytes);
        }
        // TTL validation
        if (message.ttl && message.ttl > 0) {
            const age = Date.now() - message.timestamp.getTime();
            if (age > message.ttl) {
                throw new Error('Message expired');
            }
        }
    }
    isMessageCached(message) {
        const cached = this.messageCache.get(message.id);
        if (!cached)
            return false;
        // Check if cache entry is still valid
        const age = Date.now() - cached.timestamp;
        if (age > this.config.performance.cacheTtl) {
            this.messageCache.delete(message.id);
            return false;
        }
        return true;
    }
    cacheMessage(message) {
        this.messageCache.set(message.id, {
            message,
            timestamp: Date.now()
        });
        // Cleanup old cache entries periodically
        if (Math.random() < 0.01) { // 1% chance
            this.cleanupCache();
        }
    }
    cleanupCache() {
        const now = Date.now();
        const ttl = this.config.performance.cacheTtl;
        for (const [id, entry] of this.messageCache.entries()) {
            if (now - entry.timestamp > ttl) {
                this.messageCache.delete(id);
            }
        }
    }
    getApplicableRules(message) {
        return Array.from(this.routingRules.values())
            .filter(rule => rule.enabled && rule.condition(message));
    }
    async applyRoutingRule(rule, envelope) {
        try {
            this.metrics.routingRuleStats[rule.id].applied++;
            this.emit('routing:rule-applied', rule, envelope.message);
            switch (rule.action.type) {
                case 'route':
                    if (rule.action.target) {
                        await this.routeToTarget(envelope, rule.action.target);
                    }
                    break;
                case 'transform':
                    if (rule.action.transform) {
                        envelope.message = rule.action.transform(envelope.message);
                    }
                    break;
                case 'filter':
                    // Drop the message
                    return;
                case 'broadcast':
                    await this.broadcastMessage(envelope);
                    break;
                case 'queue':
                    this.emit('message:queued', envelope);
                    break;
            }
            this.metrics.routingRuleStats[rule.id].successful++;
        }
        catch (error) {
            this.metrics.routingRuleStats[rule.id].failed++;
            throw error;
        }
    }
    async performDefaultRouting(envelope) {
        const message = envelope.message;
        if (message.to.agentId) {
            // Direct routing to specific agent
            await this.routeToTarget(envelope, message.to.agentId);
        }
        else if (message.to.capabilities) {
            // Capability-based routing
            await this.routeByCapabilities(envelope, message.to.capabilities);
        }
        else {
            // Broadcast message
            await this.broadcastMessage(envelope);
        }
    }
    async routeToTarget(envelope, targetId) {
        const adapter = this.protocolAdapters.get(envelope.message.protocol);
        if (!adapter) {
            `
      throw new Error(No adapter available for protocol: ${envelope.message.protocol}`;
            ;
        }
        await adapter.send(envelope, targetId);
        this.metrics.protocolStats[envelope.message.protocol].sent++;
        this.emit('message:routed', envelope, targetId);
    }
    async routeByCapabilities(envelope, capabilities) {
        // Use agent registry to find suitable agents
        const criteria = {
            requiredCapabilities: capabilities,
            priority: envelope.message.priority,
            tenantId: envelope.message.to.tenantId,
            workspaceId: envelope.message.to.workspaceId
        };
        const selection = await this.agentRegistry.selectOptimalAgent(criteria);
        if (!selection) {
            throw new Error(No, agents, found);
            with (capabilities)
                : $;
            {
                capabilities.join(', ');
            }
            `);
    }

    await this.routeToTarget(envelope, selection.agent.id);
  }

  private async broadcastMessage(envelope: MessageEnvelope): Promise<void> {
    const agents = await this.agentRegistry.getAllAgents({
      tenantId: envelope.message.to.tenantId,
      workspaceId: envelope.message.to.workspaceId
    });

    await Promise.all(
      agents.map((agent: UnifiedAgent) =>
        this.routeToTarget(envelope, agent.id)
      )
    );
  }

  private async routeTransactionBatch(batch: MessageBatch): Promise<void> {
    // Implementation for transactional batch routing
    // All messages must be routed successfully or none at all
    const envelopes = batch.messages.map(message => ({
      message,
      transport: { protocol: message.protocol }
    }));

    try {
      await Promise.all(
        envelopes.map(envelope => this.routeMessage(envelope))
      );
    } catch (error) {
      // Rollback any successful routings
      debug('Transaction batch failed, attempting rollback: %s', batch.batchId);
      // Implementation would depend on protocol adapters supporting rollback
      throw error;
    }
  }

  private setupDefaultRoutingRules(): void {
    // High priority messages go first
    this.addRoutingRule({
      id: 'high-priority',
      name: 'High Priority Routing',
      condition: (msg) => msg.priority === 'critical' || msg.priority === 'realtime',
      action: { type: 'route', priority: 1000 },
      enabled: true
    });

    // Error messages get immediate attention
    this.addRoutingRule({
      id: 'error-routing',
      name: 'Error Message Routing',
      condition: (msg) => msg.type === 'task_error' || msg.type === 'workflow_error',
      action: { type: 'route', priority: 900 },
      enabled: true
    });

    // Heartbeat messages can be filtered in high load
    this.addRoutingRule({
      id: 'heartbeat-throttle',
      name: 'Heartbeat Throttling',
      condition: (msg) => msg.type === 'agent_heartbeat' && this.messageQueue.size > 1000,
      action: { type: 'filter' },
      enabled: true
    });
  }

  private initializeProtocolStats(): Record<MessageProtocol, { sent: number; received: number; failed: number }> {
    const stats: any = {};
    const protocols: MessageProtocol[] = ['websocket', 'redis', 'http', 'file', 'direct'];

    protocols.forEach(protocol => {
      stats[protocol] = { sent: 0, received: 0, failed: 0 };
    });

    return stats;
  }

  private updateAverageLatency(latency: number): void {
    const total = this.metrics.averageLatency * (this.metrics.messagesRouted - 1) + latency;
    this.metrics.averageLatency = total / this.metrics.messagesRouted;
  }

  private startMetricsReporting(): void {
    setInterval(() => {
      this.emit('metrics:updated', this.metrics);
    }, 60000); // Report every minute
  }
};
        }
    }
}
exports.MessageRouter = MessageRouter;
//# sourceMappingURL=MessageRouter.js.map