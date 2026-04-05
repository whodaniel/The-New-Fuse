var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var A2AService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ap2ProtocolService } from // @ts-ignore
 '@the-new-fuse/ap2-protocol';
import { UnifiedRedisService } from // @ts-ignore
 '@the-new-fuse/infrastructure';
import { A2AMessageType, A2APriority, AgentStatus, LoadBalancingStrategy, } from './types';
let A2AService = A2AService_1 = class A2AService {
    constructor(configService, ap2ProtocolService, redisService) {
        Object.defineProperty(this, "configService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: configService
        });
        Object.defineProperty(this, "ap2ProtocolService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ap2ProtocolService
        });
        Object.defineProperty(this, "redisService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: redisService
        });
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Logger(A2AService_1.name)
        });
        Object.defineProperty(this, "agentRegistry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "activeConnections", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        }); // WebSocket connections
        Object.defineProperty(this, "messageRoutes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "pendingResponses", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "conversationContexts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Performance metrics
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                messagesSent: 0,
                messagesReceived: 0,
                averageLatency: 0,
                errorRate: 0,
                activeConversations: 0,
                throughput: 0,
            }
        });
        // Configuration
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                maxRetryAttempts: 3,
                defaultTimeout: 30000,
                heartbeatInterval: 15000,
                registryCleanupInterval: 60000,
                messageCompressionThreshold: 1024,
                batchProcessingSize: 50,
                circuitBreakerThreshold: 5,
                loadBalancingUpdateInterval: 5000,
            }
        });
        Object.defineProperty(this, "heartbeatInterval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "registryCleanupInterval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "metricsInterval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.initializeDefaultRoutes();
    }
    async createPayment(paymentDetails) {
        const paymentRequest = {
            value: paymentDetails.amount,
            currency: paymentDetails.currency,
        };
        return this.ap2ProtocolService.createPayment(paymentRequest);
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
    async registerAgent(registration) {
        try {
            const agentCapabilities = {
                id: registration.agentId,
                type: registration.type,
                capabilities: registration.capabilities,
                maxConcurrentRequests: registration.maxConcurrentRequests || 10,
                averageResponseTime: registration.averageResponseTime || 0,
                reliability: registration.reliability || 1.0,
                lastSeen: Date.now(),
                isOnline: registration.isOnline || true,
            };
            this.agentRegistry.set(registration.agentId, agentCapabilities);
            // Cache agent registration
            await this.redisService.set(`agent:${registration.agentId}`, JSON.stringify(registration), 3600 // 1 hour TTL
            );
            // Announce agent capabilities to network
            await this.broadcastMessage({
                id: this.generateMessageId(),
                fromAgent: registration.agentId,
                toAgent: '*', // Broadcast
                type: A2AMessageType.CAPABILITY_ANNOUNCEMENT,
                payload: registration,
                priority: A2APriority.MEDIUM,
                timestamp: Date.now(),
            });
            this.logger.log(`Agent registered: ${registration.agentId} (${registration.type})`);
        }
        catch (error) {
            this.logger.error('Error registering agent:', error.message);
            throw error;
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
                await this.redisService.set(`agent:${agentId}`, JSON.stringify(agent), 3600);
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
            [A2AMessageType.STATUS_UPDATE]: 'status_monitoring',
            [A2AMessageType.DATA_REQUEST]: 'data_processing',
            [A2AMessageType.DATA_RESPONSE]: 'data_processing',
            [A2AMessageType.WORKFLOW_COORDINATION]: 'workflow_management',
            [A2AMessageType.COLLABORATION_REQUEST]: 'collaboration',
            [A2AMessageType.RESOURCE_SHARING]: 'resource_management',
            [A2AMessageType.ERROR_NOTIFICATION]: 'error_handling',
            [A2AMessageType.HEARTBEAT]: 'monitoring',
            [A2AMessageType.CAPABILITY_ANNOUNCEMENT]: 'discovery',
            [A2AMessageType.REQUEST]: 'general',
            [A2AMessageType.NOTIFICATION]: 'general',
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
            // Queue message for processing (simplified implementation)
            await this.redisService.lpush('message_queue', JSON.stringify({
                id: message.id,
                type: 'a2a_message',
                payload: {
                    targetAgent,
                    message,
                },
                agentId: message.fromAgent,
                priority: message.priority,
            }));
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
            [A2APriority.CRITICAL]: 1,
            [A2APriority.HIGH]: 2,
            [A2APriority.MEDIUM]: 3,
            [A2APriority.LOW]: 4,
            [A2APriority.BATCH]: 5,
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
        const onlineAgents = Array.from(this.agentRegistry.values()).filter((agent) => agent.isOnline && agent.id !== message.fromAgent);
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
            await this.redisService.set(`conversation:${conversationId}`, JSON.stringify(conversation), 86400);
            this.conversationContexts.delete(conversationId);
            this.metrics.activeConversations--;
            return true;
        }
        return false;
    }
    // Utility methods
    validateMessage(message) {
        return !!(message.id &&
            message.fromAgent &&
            message.toAgent &&
            message.type &&
            message.payload);
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
            if (agent.isOnline && now - agent.lastSeen > staleThreshold) {
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
            onlineAgents: Array.from(this.agentRegistry.values()).filter((a) => a.isOnline).length,
            activeConnections: this.activeConnections.size,
            pendingResponses: this.pendingResponses.size,
        };
    }
    // Missing methods required by controller
    async updateAgentStatus(agentId, status) {
        const agent = this.agentRegistry.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        // Update in memory registry
        agent.isOnline = status === AgentStatus.ONLINE;
        agent.lastSeen = Date.now();
        this.agentRegistry.set(agentId, agent);
        // Update in Redis
        await this.redisService.set(`agent:status:${agentId}`, JSON.stringify({ status, timestamp: Date.now() }), 3600);
        this.logger.log(`Agent status updated: ${agentId} -> ${status}`);
    }
    async discoverAgents(criteria) {
        const agents = Array.from(this.agentRegistry.values());
        let filteredAgents = agents;
        if (criteria?.type) {
            filteredAgents = filteredAgents.filter((agent) => agent.type === criteria.type);
        }
        if (criteria?.status) {
            const isOnline = criteria.status === AgentStatus.ONLINE;
            filteredAgents = filteredAgents.filter((agent) => agent.isOnline === isOnline);
        }
        if (criteria?.capabilities) {
            filteredAgents = filteredAgents.filter((agent) => criteria.capabilities.some((cap) => agent.capabilities.includes(cap)));
        }
        // Convert AgentCapabilities to AgentRegistration format
        return filteredAgents.map((agent) => ({
            agentId: agent.id,
            name: agent.id, // Using id as name since we don't store name separately
            type: agent.type,
            version: '1.0.0', // Default version
            capabilities: agent.capabilities,
            maxConcurrentRequests: agent.maxConcurrentRequests,
            averageResponseTime: agent.averageResponseTime,
            reliability: agent.reliability,
            lastSeen: agent.lastSeen,
            isOnline: agent.isOnline,
        }));
    }
    async getOnlineAgents() {
        return this.discoverAgents({ status: AgentStatus.ONLINE });
    }
    async getAgentHealth(agentId) {
        const agent = this.agentRegistry.get(agentId);
        if (!agent) {
            return null;
        }
        return {
            agentId: agent.id,
            timestamp: new Date(agent.lastSeen).toISOString(),
            status: agent.isOnline ? AgentStatus.ONLINE : AgentStatus.OFFLINE,
            load: Math.random(), // Mock load for now
            activeConnections: this.activeConnections.has(agentId) ? 1 : 0,
            lastActivity: new Date(agent.lastSeen).toISOString(),
        };
    }
    async sendRequest(fromAgent, toAgent, payload, options) {
        const message = {
            id: this.generateMessageId(),
            fromAgent,
            toAgent,
            type: A2AMessageType.DATA_REQUEST,
            payload,
            priority: options?.priority || A2APriority.MEDIUM,
            timestamp: Date.now(),
            requiresResponse: true,
            conversationId: options?.conversationId,
        };
        await this.sendMessage(message);
        // Return the sent message (in a real implementation, you'd wait for response)
        return message;
    }
    async broadcast(fromAgent, payload, options) {
        const message = {
            id: this.generateMessageId(),
            fromAgent,
            toAgent: '*', // Broadcast to all
            type: A2AMessageType.DATA_REQUEST,
            payload,
            priority: options?.priority || A2APriority.MEDIUM,
            timestamp: Date.now(),
            metadata: {
                channel: options?.channel,
                topic: options?.topic,
            },
        };
        await this.broadcastMessage(message);
    }
    async sendResponse(originalMessage, responsePayload, fromAgent) {
        const response = {
            id: this.generateMessageId(),
            fromAgent,
            toAgent: originalMessage.fromAgent,
            type: A2AMessageType.DATA_RESPONSE,
            payload: responsePayload,
            priority: originalMessage.priority,
            timestamp: Date.now(),
            conversationId: originalMessage.conversationId,
            metadata: {
                originalMessageId: originalMessage.id,
            },
        };
        await this.sendMessage(response);
    }
    async joinConversation(conversationId, agentId) {
        const conversation = this.conversationContexts.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }
        if (!conversation.participants.includes(agentId)) {
            conversation.participants.push(agentId);
            conversation.updatedAt = new Date().toISOString();
            this.conversationContexts.set(conversationId, conversation);
        }
        this.logger.log(`Agent ${agentId} joined conversation ${conversationId}`);
    }
    async leaveConversation(conversationId, agentId) {
        const conversation = this.conversationContexts.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }
        conversation.participants = conversation.participants.filter((id) => id !== agentId);
        conversation.updatedAt = new Date().toISOString();
        this.conversationContexts.set(conversationId, conversation);
        this.logger.log(`Agent ${agentId} left conversation ${conversationId}`);
    }
    async facilitateAgentHandshake(agent1Id, agent2Id) {
        const agent1 = this.agentRegistry.get(agent1Id);
        const agent2 = this.agentRegistry.get(agent2Id);
        if (!agent1 || !agent2) {
            throw new Error('One or both agents not found');
        }
        // Send handshake initiation
        await this.sendMessage({
            id: this.generateMessageId(),
            fromAgent: 'system',
            toAgent: agent1Id,
            type: A2AMessageType.COLLABORATION_REQUEST,
            payload: { handshakeWith: agent2Id, agentInfo: agent2 },
            priority: A2APriority.HIGH,
            timestamp: Date.now(),
        });
        await this.sendMessage({
            id: this.generateMessageId(),
            fromAgent: 'system',
            toAgent: agent2Id,
            type: A2AMessageType.COLLABORATION_REQUEST,
            payload: { handshakeWith: agent1Id, agentInfo: agent1 },
            priority: A2APriority.HIGH,
            timestamp: Date.now(),
        });
        this.logger.log(`Facilitated handshake between ${agent1Id} and ${agent2Id}`);
    }
    async routeMessageByCapability(fromAgent, targetCapability, payload, options) {
        const capableAgents = Array.from(this.agentRegistry.values()).filter((agent) => agent.capabilities.includes(targetCapability) && agent.isOnline);
        if (capableAgents.length === 0) {
            throw new Error(`No agents found with capability: ${targetCapability}`);
        }
        // Choose agent based on preference or load balancing
        let targetAgent = capableAgents[0];
        if (options?.preferredAgent) {
            const preferred = capableAgents.find((agent) => agent.id === options.preferredAgent);
            if (preferred) {
                targetAgent = preferred;
            }
        }
        else {
            // Simple load balancing - choose least loaded
            targetAgent = capableAgents.reduce((least, current) => current.maxConcurrentRequests > least.maxConcurrentRequests ? current : least);
        }
        const message = {
            id: this.generateMessageId(),
            fromAgent,
            toAgent: targetAgent.id,
            type: A2AMessageType.TASK_ASSIGNMENT,
            payload,
            priority: options?.priority || A2APriority.MEDIUM,
            timestamp: Date.now(),
            metadata: { routedByCapability: targetCapability },
        };
        await this.sendMessage(message);
    }
    async createAgentCommunicationChannel(agentIds, topic) {
        return this.startConversation(agentIds, { topic });
    }
    async sendHeartbeat(heartbeat) {
        const agent = this.agentRegistry.get(heartbeat.agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${heartbeat.agentId}`);
        }
        // Update agent's last seen time
        agent.lastSeen = new Date(heartbeat.timestamp).getTime();
        agent.isOnline = heartbeat.status === AgentStatus.ONLINE;
        this.agentRegistry.set(heartbeat.agentId, agent);
        // Store heartbeat in Redis
        await this.redisService.set(`heartbeat:${heartbeat.agentId}`, JSON.stringify(heartbeat), (this.config.heartbeatInterval * 2) / 1000 // TTL in seconds
        );
        this.logger.debug(`Heartbeat received from ${heartbeat.agentId}`);
    }
    async getSystemStats() {
        return {
            totalAgents: this.agentRegistry.size,
            onlineAgents: Array.from(this.agentRegistry.values()).filter((a) => a.isOnline).length,
            activeConnections: this.activeConnections.size,
            activeConversations: this.conversationContexts.size,
            pendingResponses: this.pendingResponses.size,
            metrics: this.metrics,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
    getConnectedWebSocketAgents() {
        return Array.from(this.activeConnections.keys());
    }
    async findAgentsByCapability(capabilityName) {
        return this.discoverAgents({ capabilities: [capabilityName] });
    }
    isAgentConnectedViaWebSocket(agentId) {
        return this.activeConnections.has(agentId);
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
A2AService = A2AService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof Ap2ProtocolService !== "undefined" && Ap2ProtocolService) === "function" ? _a : Object, UnifiedRedisService])
], A2AService);
export { A2AService };
