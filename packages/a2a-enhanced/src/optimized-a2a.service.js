// Enhanced A2A Protocol Service - Optimized Agent-to-Agent communication
// Features intelligent routing, message compression, priority queuing, and fault tolerance
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OptimizedA2AService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../../cache/src/redis-cache.service';
import { OptimizedQueueService, JobType, JobPriority } from '../../job-queue/src/optimized-queue.service';
export var A2AMessageType;
(function (A2AMessageType) {
    A2AMessageType["TASK_ASSIGNMENT"] = "task_assignment";
    A2AMessageType["STATUS_UPDATE"] = "status_update";
    A2AMessageType["DATA_REQUEST"] = "data_request";
    A2AMessageType["DATA_RESPONSE"] = "data_response";
    A2AMessageType["COLLABORATION_REQUEST"] = "collaboration_request";
    A2AMessageType["WORKFLOW_COORDINATION"] = "workflow_coordination";
    A2AMessageType["RESOURCE_SHARING"] = "resource_sharing";
    A2AMessageType["ERROR_NOTIFICATION"] = "error_notification";
    A2AMessageType["HEARTBEAT"] = "heartbeat";
    A2AMessageType["CAPABILITY_ANNOUNCEMENT"] = "capability_announcement";
})(A2AMessageType || (A2AMessageType = {}));
export var A2APriority;
(function (A2APriority) {
    A2APriority[A2APriority["CRITICAL"] = 1] = "CRITICAL";
    A2APriority[A2APriority["HIGH"] = 2] = "HIGH";
    A2APriority[A2APriority["MEDIUM"] = 3] = "MEDIUM";
    A2APriority[A2APriority["LOW"] = 4] = "LOW";
    A2APriority[A2APriority["BATCH"] = 5] = "BATCH";
})(A2APriority || (A2APriority = {}));
export var AgentType;
(function (AgentType) {
    AgentType["COORDINATOR"] = "coordinator";
    AgentType["WORKER"] = "worker";
    AgentType["SPECIALIST"] = "specialist";
    AgentType["MONITOR"] = "monitor";
    AgentType["GATEWAY"] = "gateway";
})(AgentType || (AgentType = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ONLINE"] = "online";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
export var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_LOADED"] = "least_loaded";
    LoadBalancingStrategy["FASTEST_RESPONSE"] = "fastest_response";
    LoadBalancingStrategy["CAPABILITY_MATCH"] = "capability_match";
    LoadBalancingStrategy["GEOGRAPHIC"] = "geographic";
})(LoadBalancingStrategy || (LoadBalancingStrategy = {}));
let OptimizedA2AService = OptimizedA2AService_1 = class OptimizedA2AService {
    constructor(configService, cacheService, queueService) {
        this.configService = configService;
        this.cacheService = cacheService;
        this.queueService = queueService;
        this.logger = new Logger(OptimizedA2AService_1.name);
        this.agentRegistry = new Map();
        this.activeConnections = new Map(); // WebSocket connections
        this.messageRoutes = new Map();
        this.pendingResponses = new Map();
        this.conversationContexts = new Map();
        // Performance metrics
        this.metrics = {
            messagesSent: 0,
            messagesReceived: 0,
            averageLatency: 0,
            errorRate: 0,
            activeConversations: 0,
            throughput: 0,
        };
        // Configuration
        this.config = {
            maxRetryAttempts: 3,
            defaultTimeout: 30000,
            heartbeatInterval: 15000,
            registryCleanupInterval: 60000,
            messageCompressionThreshold: 1024,
            batchProcessingSize: 50,
            circuitBreakerThreshold: 5,
            loadBalancingUpdateInterval: 5000,
        };
        this.initializeDefaultRoutes();
    }
    async onModuleInit() {
        await this.initializeService();
        this.startHeartbeat();
        this.startRegistryCleanup();
        this.startMetricsCollection();
        this.logger.log('Enhanced A2A Service initialized');
    }
    async initializeService() {
        // Load agent registry from cache
        await this.loadAgentRegistry();
        // Initialize routing rules
        this.initializeDefaultRoutes();
        // Set up message processing
        this.setupMessageProcessing();
    }
    initializeDefaultRoutes() {
        // Define default routing rules for different message types
        const defaultRoutes = [
            {
                type: A2AMessageType.TASK_ASSIGNMENT,
                rule: {
                    priority: A2APriority.HIGH,
                    preferredAgents: [],
                    fallbackAgents: [],
                    loadBalancingStrategy: LoadBalancingStrategy.LEAST_LOADED,
                    timeoutMs: 15000,
                },
            },
            {
                type: A2AMessageType.WORKFLOW_COORDINATION,
                rule: {
                    priority: A2APriority.HIGH,
                    preferredAgents: [],
                    fallbackAgents: [],
                    loadBalancingStrategy: LoadBalancingStrategy.CAPABILITY_MATCH,
                    timeoutMs: 20000,
                },
            },
            {
                type: A2AMessageType.STATUS_UPDATE,
                rule: {
                    priority: A2APriority.MEDIUM,
                    preferredAgents: [],
                    fallbackAgents: [],
                    loadBalancingStrategy: LoadBalancingStrategy.FASTEST_RESPONSE,
                    timeoutMs: 10000,
                },
            },
            {
                type: A2AMessageType.DATA_REQUEST,
                rule: {
                    priority: A2APriority.MEDIUM,
                    preferredAgents: [],
                    fallbackAgents: [],
                    loadBalancingStrategy: LoadBalancingStrategy.CAPABILITY_MATCH,
                    timeoutMs: 25000,
                },
            },
        ];
        defaultRoutes.forEach(({ type, rule }) => {
            this.messageRoutes.set(type, { messageType: type, ...rule });
        });
    }
    // Agent registration and discovery
    async registerAgent(agentCapabilities) {
        try {
            this.agentRegistry.set(agentCapabilities.id, {
                ...agentCapabilities,
                lastSeen: Date.now(),
                isOnline: true,
            });
            // Cache agent capabilities
            await this.cacheService.cacheAgent(agentCapabilities.id, agentCapabilities);
            // Announce agent capabilities to network
            await this.broadcastMessage({
                id: this.generateMessageId(),
                fromAgent: agentCapabilities.id,
                toAgent: '*', // Broadcast
                type: A2AMessageType.CAPABILITY_ANNOUNCEMENT,
                payload: agentCapabilities,
                priority: A2APriority.MEDIUM,
                timestamp: Date.now(),
            });
            this.logger.log(`Agent registered: ${agentCapabilities.id} (${agentCapabilities.type})`);
            return true;
        }
        catch (error) {
            this.logger.error('Error registering agent:', error);
            return false;
        }
    }
    async unregisterAgent(agentId) {
        try {
            const agent = this.agentRegistry.get(agentId);
            if (agent) {
                agent.isOnline = false;
                agent.lastSeen = Date.now();
                // Remove from active connections
                this.activeConnections.delete(agentId);
                // Update cache
                await this.cacheService.cacheAgent(agentId, agent);
                this.logger.log(`Agent unregistered: ${agentId}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('Error unregistering agent:', error);
            return false;
        }
    }
    // Enhanced message sending with intelligent routing
    async sendMessage(message) {
        try {
            // Validate message
            if (!this.validateMessage(message)) {
                throw new Error('Invalid message format');
            }
            // Apply routing logic
            const targetAgent = await this.routeMessage(message);
            if (!targetAgent) {
                throw new Error('No available agent found for message routing');
            }
            // Optimize message for transmission
            const optimizedMessage = await this.optimizeMessage(message);
            // Send message based on priority
            if (message.priority <= A2APriority.HIGH) {
                return await this.sendImmediateMessage(targetAgent, optimizedMessage);
            }
            else {
                return await this.queueMessage(targetAgent, optimizedMessage);
            }
        }
        catch (error) {
            this.logger.error('Error sending A2A message:', error);
            this.metrics.errorRate++;
            return {
                messageId: message.id,
                success: false,
                error: error.message,
                processingTime: 0,
                agentStatus: AgentStatus.ERROR,
            };
        }
    }
    async routeMessage(message) {
        // If specific agent is targeted, check availability
        if (message.toAgent !== '*') {
            const agent = this.agentRegistry.get(message.toAgent);
            if (agent && agent.isOnline) {
                return message.toAgent;
            }
        }
        // Get routing rule for message type
        const route = this.messageRoutes.get(message.type);
        if (!route) {
            return null;
        }
        // Find suitable agents based on capabilities and load balancing
        const suitableAgents = await this.findSuitableAgents(message, route);
        if (suitableAgents.length === 0) {
            return null;
        }
        // Apply load balancing strategy
        return this.selectAgentByStrategy(suitableAgents, route.loadBalancingStrategy);
    }
    async findSuitableAgents(message, route) {
        const suitableAgents = [];
        for (const [agentId, agent] of this.agentRegistry) {
            if (!agent.isOnline || agentId === message.fromAgent) {
                continue;
            }
            // Check if agent can handle this message type
            if (this.canAgentHandleMessage(agent, message)) {
                suitableAgents.push(agentId);
            }
        }
        return suitableAgents;
    }
    canAgentHandleMessage(agent, message) {
        // Check if agent has required capabilities
        const requiredCapability = this.getRequiredCapabilityForMessage(message.type);
        return agent.capabilities.includes(requiredCapability);
    }
    getRequiredCapabilityForMessage(messageType) {
        const capabilityMap = {
            [A2AMessageType.TASK_ASSIGNMENT]: 'task_execution',
            [A2AMessageType.DATA_REQUEST]: 'data_processing',
            [A2AMessageType.WORKFLOW_COORDINATION]: 'workflow_management',
            [A2AMessageType.COLLABORATION_REQUEST]: 'collaboration',
            [A2AMessageType.RESOURCE_SHARING]: 'resource_management',
        };
        return capabilityMap[messageType] || 'general';
    }
    selectAgentByStrategy(agents, strategy) {
        switch (strategy) {
            case LoadBalancingStrategy.ROUND_ROBIN:
                return this.selectRoundRobin(agents);
            case LoadBalancingStrategy.LEAST_LOADED:
                return this.selectLeastLoaded(agents);
            case LoadBalancingStrategy.FASTEST_RESPONSE:
                return this.selectFastestResponse(agents);
            case LoadBalancingStrategy.CAPABILITY_MATCH:
                return this.selectBestCapabilityMatch(agents);
            default:
                return agents[0];
        }
    }
    selectRoundRobin(agents) {
        // Simple round-robin implementation
        const timestamp = Date.now();
        const index = timestamp % agents.length;
        return agents[index];
    }
    selectLeastLoaded(agents) {
        let leastLoaded = agents[0];
        let minLoad = Infinity;
        for (const agentId of agents) {
            const agent = this.agentRegistry.get(agentId);
            if (agent) {
                const currentLoad = this.calculateAgentLoad(agent);
                if (currentLoad < minLoad) {
                    minLoad = currentLoad;
                    leastLoaded = agentId;
                }
            }
        }
        return leastLoaded;
    }
    selectFastestResponse(agents) {
        let fastest = agents[0];
        let minResponseTime = Infinity;
        for (const agentId of agents) {
            const agent = this.agentRegistry.get(agentId);
            if (agent && agent.averageResponseTime < minResponseTime) {
                minResponseTime = agent.averageResponseTime;
                fastest = agentId;
            }
        }
        return fastest;
    }
    selectBestCapabilityMatch(agents) {
        // Select agent with highest reliability for capability matching
        let bestMatch = agents[0];
        let maxReliability = 0;
        for (const agentId of agents) {
            const agent = this.agentRegistry.get(agentId);
            if (agent && agent.reliability > maxReliability) {
                maxReliability = agent.reliability;
                bestMatch = agentId;
            }
        }
        return bestMatch;
    }
    calculateAgentLoad(agent) {
        // Calculate current load based on concurrent requests and response time
        const activeRequests = this.getActiveRequestsForAgent(agent.id);
        return (activeRequests / agent.maxConcurrentRequests) * 100;
    }
    getActiveRequestsForAgent(agentId) {
        // Count pending responses for this agent
        let count = 0;
        for (const [messageId, pendingResponse] of this.pendingResponses) {
            if (messageId.startsWith(agentId)) {
                count++;
            }
        }
        return count;
    }
    // Message optimization and compression
    async optimizeMessage(message) {
        let optimizedMessage = { ...message };
        // Compress large payloads
        const messageSize = JSON.stringify(message).length;
        if (messageSize > this.config.messageCompressionThreshold) {
            optimizedMessage = await this.compressMessage(message);
        }
        // Add routing metadata
        optimizedMessage.metadata = {
            ...optimizedMessage.metadata,
            routedAt: Date.now(),
            originalSize: messageSize,
            optimized: true,
        };
        return optimizedMessage;
    }
    async compressMessage(message) {
        // Simple compression implementation (in production, use proper compression)
        return {
            ...message,
            payload: {
                compressed: true,
                data: JSON.stringify(message.payload),
                algorithm: 'simple',
            },
            metadata: {
                ...message.metadata,
                compressed: true,
            },
        };
    }
    // Immediate and queued message sending
    async sendImmediateMessage(targetAgent, message) {
        const startTime = Date.now();
        try {
            // Check if agent is connected via WebSocket
            const connection = this.activeConnections.get(targetAgent);
            if (connection && connection.connected) {
                return await this.sendViaWebSocket(connection, message);
            }
            // Fallback to HTTP/REST API
            return await this.sendViaHTTP(targetAgent, message);
        }
        catch (error) {
            this.logger.error(`Error sending immediate message to ${targetAgent}:`, error);
            return {
                messageId: message.id,
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime,
                agentStatus: AgentStatus.ERROR,
            };
        }
    }
    async queueMessage(targetAgent, message) {
        try {
            // Add to job queue for processing
            await this.queueService.addJob(JobType.AGENT_COMMUNICATION, {
                id: message.id,
                type: 'a2a_message',
                payload: {
                    targetAgent,
                    message,
                },
                agentId: message.fromAgent,
                priority: this.mapA2APriorityToJobPriority(message.priority),
            });
            return {
                messageId: message.id,
                success: true,
                data: { queued: true },
                processingTime: 0,
                agentStatus: AgentStatus.ONLINE,
            };
        }
        catch (error) {
            this.logger.error('Error queuing A2A message:', error);
            return {
                messageId: message.id,
                success: false,
                error: error.message,
                processingTime: 0,
                agentStatus: AgentStatus.ERROR,
            };
        }
    }
    mapA2APriorityToJobPriority(a2aPriority) {
        const mapping = {
            [A2APriority.CRITICAL]: JobPriority.CRITICAL,
            [A2APriority.HIGH]: JobPriority.HIGH,
            [A2APriority.MEDIUM]: JobPriority.MEDIUM,
            [A2APriority.LOW]: JobPriority.LOW,
            [A2APriority.BATCH]: JobPriority.BATCH,
        };
        return mapping[a2aPriority];
    }
    async sendViaWebSocket(connection, message) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingResponses.delete(message.id);
                reject(new Error('Message timeout'));
            }, this.config.defaultTimeout);
            this.pendingResponses.set(message.id, { resolve, reject, timeout });
            connection.emit('a2a_message', message);
            this.metrics.messagesSent++;
        });
    }
    async sendViaHTTP(targetAgent, message) {
        // Implementation for HTTP-based agent communication
        // This would make HTTP requests to agent endpoints
        throw new Error('HTTP agent communication not implemented');
    }
    // Broadcast messaging
    async broadcastMessage(message) {
        const responses = [];
        const onlineAgents = Array.from(this.agentRegistry.values())
            .filter(agent => agent.isOnline && agent.id !== message.fromAgent);
        // Send to all online agents in parallel
        const sendPromises = onlineAgents.map(async (agent) => {
            const targetedMessage = { ...message, toAgent: agent.id };
            return this.sendMessage(targetedMessage);
        });
        const results = await Promise.allSettled(sendPromises);
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                responses.push(result.value);
            }
            else {
                responses.push({
                    messageId: message.id,
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                    processingTime: 0,
                    agentStatus: AgentStatus.ERROR,
                });
            }
        });
        return responses;
    }
    // Conversation management
    async startConversation(participants, context) {
        const conversationId = this.generateConversationId();
        this.conversationContexts.set(conversationId, {
            id: conversationId,
            participants,
            context: context || {},
            startedAt: Date.now(),
            messageCount: 0,
            isActive: true,
        });
        this.metrics.activeConversations++;
        return conversationId;
    }
    async endConversation(conversationId) {
        const conversation = this.conversationContexts.get(conversationId);
        if (conversation) {
            conversation.isActive = false;
            conversation.endedAt = Date.now();
            // Archive conversation
            await this.cacheService.set(`conversation:${conversationId}`, conversation, { ttl: 86400 });
            this.conversationContexts.delete(conversationId);
            this.metrics.activeConversations--;
            return true;
        }
        return false;
    }
    // Utility methods
    validateMessage(message) {
        return !!(message.id && message.fromAgent && message.toAgent && message.type && message.payload);
    }
    generateMessageId() {
        return `a2a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    setupMessageProcessing() {
        // Set up message processing handlers
        // This would integrate with WebSocket service and job queue
    }
    async loadAgentRegistry() {
        // Load agent registry from cache or database
        try {
            // Implementation to restore agent registry from persistent storage
        }
        catch (error) {
            this.logger.error('Error loading agent registry:', error);
        }
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            await this.sendHeartbeats();
        }, this.config.heartbeatInterval);
    }
    async sendHeartbeats() {
        const heartbeatMessage = {
            id: this.generateMessageId(),
            fromAgent: 'system',
            toAgent: '*',
            type: A2AMessageType.HEARTBEAT,
            payload: { timestamp: Date.now() },
            priority: A2APriority.LOW,
            timestamp: Date.now(),
            ttl: this.config.heartbeatInterval * 2,
        };
        // Send heartbeat to all registered agents
        for (const agentId of this.agentRegistry.keys()) {
            try {
                await this.sendMessage({ ...heartbeatMessage, toAgent: agentId });
            }
            catch (error) {
                // Mark agent as potentially offline if heartbeat fails
                const agent = this.agentRegistry.get(agentId);
                if (agent) {
                    agent.reliability = Math.max(0, agent.reliability - 0.1);
                }
            }
        }
    }
    startRegistryCleanup() {
        this.registryCleanupInterval = setInterval(() => {
            this.cleanupStaleAgents();
        }, this.config.registryCleanupInterval);
    }
    cleanupStaleAgents() {
        const now = Date.now();
        const staleThreshold = this.config.heartbeatInterval * 3; // 3 missed heartbeats
        for (const [agentId, agent] of this.agentRegistry) {
            if (agent.isOnline && (now - agent.lastSeen) > staleThreshold) {
                agent.isOnline = false;
                this.activeConnections.delete(agentId);
                this.logger.warn(`Agent marked as offline due to stale heartbeat: ${agentId}`);
            }
        }
    }
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, 60000); // Collect metrics every minute
    }
    collectMetrics() {
        // Calculate throughput and other metrics
        // Implementation would update metrics based on recent activity
    }
    async getMetrics() {
        return {
            ...this.metrics,
            registeredAgents: this.agentRegistry.size,
            onlineAgents: Array.from(this.agentRegistry.values()).filter(a => a.isOnline).length,
            activeConnections: this.activeConnections.size,
            pendingResponses: this.pendingResponses.size,
        };
    }
    async onModuleDestroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.registryCleanupInterval) {
            clearInterval(this.registryCleanupInterval);
        }
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        // Clear pending responses
        for (const [messageId, pending] of this.pendingResponses) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Service shutting down'));
        }
        this.logger.log('Enhanced A2A Service shutdown complete');
    }
};
OptimizedA2AService = OptimizedA2AService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        RedisCacheService,
        OptimizedQueueService])
], OptimizedA2AService);
export { OptimizedA2AService };
//# sourceMappingURL=optimized-a2a.service.js.map