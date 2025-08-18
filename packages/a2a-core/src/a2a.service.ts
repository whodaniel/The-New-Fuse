import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import {
  AgentRegistration,
  A2AMessage,
  AgentHeartbeat,
  AgentStatus,
  A2AMessageType,
  A2APriority,
  AgentCapabilities,
  RoutingRule,
  LoadBalancingStrategy,
  AgentType,
  A2AResponse,
  A2AConfig
} from './types';


@Injectable()
export class A2AService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(A2AService.name);
  
  private agentRegistry: Map<string, AgentCapabilities> = new Map();
  private activeConnections: Map<string, any> = new Map(); // WebSocket connections
  private messageRoutes: Map<string, RoutingRule> = new Map();
  private pendingResponses: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
  private conversationContexts: Map<string, any> = new Map();

  // Performance metrics
  private metrics = {
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0,
    errorRate: 0,
    activeConversations: 0,
    throughput: 0,
  };

  // Configuration
  private readonly config = {
    maxRetryAttempts: 3,
    defaultTimeout: 30000,
    heartbeatInterval: 15000,
    registryCleanupInterval: 60000,
    messageCompressionThreshold: 1024,
    batchProcessingSize: 50,
    circuitBreakerThreshold: 5,
    loadBalancingUpdateInterval: 5000,
  };

  private heartbeatInterval?: NodeJS.Timeout;
  private registryCleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  private redis: Redis;

  constructor(
    private configService: ConfigService
  ) {
    this.initializeDefaultRoutes();
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get('REDIS_PORT') || 6379,
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB') || 0,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.initializeService();
    this.startHeartbeat();
    this.startRegistryCleanup();
    this.startMetricsCollection();
    this.logger.log('Enhanced A2A Service initialized');
  }

  private async initializeService(): Promise<void> {
    // Load agent registry from cache
    await this.loadAgentRegistry();
    
    // Initialize routing rules
    this.initializeDefaultRoutes();
    
    // Set up message processing
    this.setupMessageProcessing();
  }

  private initializeDefaultRoutes(): void {
    // Define default routing rules for different message types
    const defaultRoutes: Array<{ type: A2AMessageType; rule: Omit<RoutingRule, 'messageType'> }> = [
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
  async registerAgent(registration: AgentRegistration): Promise<void> {
    try {
      const agentCapabilities: AgentCapabilities = {
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
      await this.redis.setex(
        `agent:${registration.agentId}`,
        3600, // 1 hour TTL
        JSON.stringify(registration)
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

    } catch (error) {
      this.logger.error('Error registering agent:', (error as Error).message);
      throw error;
    }
  }

  async unregisterAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agentRegistry.get(agentId);
      if (agent) {
        agent.isOnline = false;
        agent.lastSeen = Date.now();
        
        // Remove from active connections
        this.activeConnections.delete(agentId);
        
        // Update cache
        await this.redis.setex(`agent:${agentId}`, 3600, JSON.stringify(agent));
        
        this.logger.log(`Agent unregistered: ${agentId}`);
        return true;
      }
      return false;

    } catch (error) {
      this.logger.error('Error unregistering agent:', error);
      return false;
    }
  }

  // Enhanced message sending with intelligent routing
  async sendMessage(message: A2AMessage): Promise<A2AResponse> {
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
      } else {
        return await this.queueMessage(targetAgent, optimizedMessage);
      }

    } catch (error) {
      this.logger.error('Error sending A2A message:', error);
      this.metrics.errorRate++;
      
      return {
        messageId: message.id,
        success: false,
        error: (error as Error).message,
        processingTime: 0,
        agentStatus: AgentStatus.ERROR,
      };
    }
  }

  private async routeMessage(message: A2AMessage): Promise<string | null> {
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

  private async findSuitableAgents(message: A2AMessage, route: RoutingRule): Promise<string[]> {
    const suitableAgents: string[] = [];

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

  private canAgentHandleMessage(agent: AgentCapabilities, message: A2AMessage): boolean {
    // Check if agent has required capabilities
    const requiredCapability = this.getRequiredCapabilityForMessage(message.type);
    return agent.capabilities.includes(requiredCapability);
  }

  private getRequiredCapabilityForMessage(messageType: A2AMessageType): string {
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
    };

    return capabilityMap[messageType] || 'general';
  }

  private selectAgentByStrategy(agents: string[], strategy: LoadBalancingStrategy): string {
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

  private selectRoundRobin(agents: string[]): string {
    // Simple round-robin implementation
    const timestamp = Date.now();
    const index = timestamp % agents.length;
    return agents[index];
  }

  private selectLeastLoaded(agents: string[]): string {
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

  private selectFastestResponse(agents: string[]): string {
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

  private selectBestCapabilityMatch(agents: string[]): string {
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

  private calculateAgentLoad(agent: AgentCapabilities): number {
    // Calculate current load based on concurrent requests and response time
    const activeRequests = this.getActiveRequestsForAgent(agent.id);
    return (activeRequests / agent.maxConcurrentRequests) * 100;
  }

  private getActiveRequestsForAgent(agentId: string): number {
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
  private async optimizeMessage(message: A2AMessage): Promise<A2AMessage> {
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

  private async compressMessage(message: A2AMessage): Promise<A2AMessage> {
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
  private async sendImmediateMessage(targetAgent: string, message: A2AMessage): Promise<A2AResponse> {
    const startTime = Date.now();

    try {
      // Check if agent is connected via WebSocket
      const connection = this.activeConnections.get(targetAgent);
      if (connection && connection.connected) {
        return await this.sendViaWebSocket(connection, message);
      }

      // Fallback to HTTP/REST API
      return await this.sendViaHTTP(targetAgent, message);

    } catch (error) {
      this.logger.error(`Error sending immediate message to ${targetAgent}:`, error);
      
      return {
        messageId: message.id,
        success: false,
        error: (error as Error).message,
        processingTime: Date.now() - startTime,
        agentStatus: AgentStatus.ERROR,
      };
    }
  }

  private async queueMessage(targetAgent: string, message: A2AMessage): Promise<A2AResponse> {
    try {
      // Add to job queue for processing
      // Queue message for processing (simplified implementation)
      await this.redis.lpush('message_queue', JSON.stringify({
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

    } catch (error) {
      this.logger.error('Error queuing A2A message:', error);
      
      return {
        messageId: message.id,
        success: false,
        error: (error as Error).message,
        processingTime: 0,
        agentStatus: AgentStatus.ERROR,
      };
    }
  }

  private mapA2APriorityToJobPriority(a2aPriority: A2APriority): number {
    const mapping = {
      [A2APriority.CRITICAL]: 1,
      [A2APriority.HIGH]: 2,
      [A2APriority.MEDIUM]: 3,
      [A2APriority.LOW]: 4,
      [A2APriority.BATCH]: 5,
    };
    return mapping[a2aPriority];
  }

  private async sendViaWebSocket(connection: any, message: A2AMessage): Promise<A2AResponse> {
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

  private async sendViaHTTP(targetAgent: string, message: A2AMessage): Promise<A2AResponse> {
    // Implementation for HTTP-based agent communication
    // This would make HTTP requests to agent endpoints
    throw new Error('HTTP agent communication not implemented');
  }

  // Broadcast messaging
  async broadcastMessage(message: A2AMessage): Promise<A2AResponse[]> {
    const responses: A2AResponse[] = [];
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
      } else {
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
  async startConversation(participants: string[], context?: any): Promise<string> {
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

  async endConversation(conversationId: string): Promise<boolean> {
    const conversation = this.conversationContexts.get(conversationId);
    if (conversation) {
      conversation.isActive = false;
      conversation.endedAt = Date.now();
      
      // Archive conversation
      await this.redis.setex(`conversation:${conversationId}`, 86400, JSON.stringify(conversation));
      this.conversationContexts.delete(conversationId);
      
      this.metrics.activeConversations--;
      return true;
    }
    return false;
  }

  // Utility methods
  private validateMessage(message: A2AMessage): boolean {
    return !!(message.id && message.fromAgent && message.toAgent && message.type && message.payload);
  }

  private generateMessageId(): string {
    return `a2a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupMessageProcessing(): void {
    // Set up message processing handlers
    // This would integrate with WebSocket service and job queue
  }

  private async loadAgentRegistry(): Promise<void> {
    // Load agent registry from cache or database
    try {
      // Implementation to restore agent registry from persistent storage
    } catch (error) {
      this.logger.error('Error loading agent registry:', error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeats();
    }, this.config.heartbeatInterval);
  }

  private async sendHeartbeats(): Promise<void> {
    const heartbeatMessage: A2AMessage = {
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
      } catch (error) {
        // Mark agent as potentially offline if heartbeat fails
        const agent = this.agentRegistry.get(agentId);
        if (agent) {
          agent.reliability = Math.max(0, agent.reliability - 0.1);
        }
      }
    }
  }

  private startRegistryCleanup(): void {
    this.registryCleanupInterval = setInterval(() => {
      this.cleanupStaleAgents();
    }, this.config.registryCleanupInterval);
  }

  private cleanupStaleAgents(): void {
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

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect metrics every minute
  }

  private collectMetrics(): void {
    // Calculate throughput and other metrics
    // Implementation would update metrics based on recent activity
  }

  async getMetrics(): Promise<any> {
    return {
      ...this.metrics,
      registeredAgents: this.agentRegistry.size,
      onlineAgents: Array.from(this.agentRegistry.values()).filter(a => a.isOnline).length,
      activeConnections: this.activeConnections.size,
      pendingResponses: this.pendingResponses.size,
    };
  }

  // Missing methods required by controller
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    // Update in memory registry
    agent.isOnline = status === AgentStatus.ONLINE;
    agent.lastSeen = Date.now();
    this.agentRegistry.set(agentId, agent);
    
    // Update in Redis
    await this.redis.setex(
      `agent:status:${agentId}`,
      3600,
      JSON.stringify({ status, timestamp: Date.now() })
    );
    
    this.logger.log(`Agent status updated: ${agentId} -> ${status}`);
  }

  async discoverAgents(criteria?: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  }): Promise<AgentRegistration[]> {
    const agents = Array.from(this.agentRegistry.values());
    let filteredAgents = agents;

    if (criteria?.type) {
      filteredAgents = filteredAgents.filter(agent => agent.type === criteria.type);
    }

    if (criteria?.status) {
      const isOnline = criteria.status === AgentStatus.ONLINE;
      filteredAgents = filteredAgents.filter(agent => agent.isOnline === isOnline);
    }

    if (criteria?.capabilities) {
      filteredAgents = filteredAgents.filter(agent =>
        criteria.capabilities!.some(cap => agent.capabilities.includes(cap))
      );
    }

    // Convert AgentCapabilities to AgentRegistration format
    return filteredAgents.map(agent => ({
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

  async getOnlineAgents(): Promise<AgentRegistration[]> {
    return this.discoverAgents({ status: AgentStatus.ONLINE });
  }

  async getAgentHealth(agentId: string): Promise<AgentHeartbeat | null> {
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

  async sendRequest(
    fromAgent: string,
    toAgent: string,
    payload: any,
    options?: {
      timeout?: number;
      priority?: A2APriority;
      conversationId?: string;
    }
  ): Promise<A2AMessage> {
    const message: A2AMessage = {
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

  async broadcast(
    fromAgent: string,
    payload: any,
    options?: {
      channel?: string;
      topic?: string;
      priority?: A2APriority;
    }
  ): Promise<void> {
    const message: A2AMessage = {
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

  async sendResponse(
    originalMessage: A2AMessage,
    responsePayload: any,
    fromAgent: string
  ): Promise<void> {
    const response: A2AMessage = {
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

  async joinConversation(conversationId: string, agentId: string): Promise<void> {
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

  async leaveConversation(conversationId: string, agentId: string): Promise<void> {
    const conversation = this.conversationContexts.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    conversation.participants = conversation.participants.filter((id: string) => id !== agentId);
    conversation.updatedAt = new Date().toISOString();
    this.conversationContexts.set(conversationId, conversation);

    this.logger.log(`Agent ${agentId} left conversation ${conversationId}`);
  }

  async facilitateAgentHandshake(agent1Id: string, agent2Id: string): Promise<void> {
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

  async routeMessageByCapability(
    fromAgent: string,
    targetCapability: string,
    payload: any,
    options?: {
      priority?: A2APriority;
      preferredAgent?: string;
    }
  ): Promise<void> {
    const capableAgents = Array.from(this.agentRegistry.values())
      .filter(agent => agent.capabilities.includes(targetCapability) && agent.isOnline);

    if (capableAgents.length === 0) {
      throw new Error(`No agents found with capability: ${targetCapability}`);
    }

    // Choose agent based on preference or load balancing
    let targetAgent = capableAgents[0];
    if (options?.preferredAgent) {
      const preferred = capableAgents.find(agent => agent.id === options.preferredAgent);
      if (preferred) {
        targetAgent = preferred;
      }
    } else {
      // Simple load balancing - choose least loaded
      targetAgent = capableAgents.reduce((least, current) =>
        current.maxConcurrentRequests > least.maxConcurrentRequests ? current : least
      );
    }

    const message: A2AMessage = {
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

  async createAgentCommunicationChannel(
    agentIds: string[],
    topic?: string
  ): Promise<string> {
    return this.startConversation(agentIds, { topic });
  }

  async sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    const agent = this.agentRegistry.get(heartbeat.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${heartbeat.agentId}`);
    }

    // Update agent's last seen time
    agent.lastSeen = new Date(heartbeat.timestamp).getTime();
    agent.isOnline = heartbeat.status === AgentStatus.ONLINE;
    this.agentRegistry.set(heartbeat.agentId, agent);

    // Store heartbeat in Redis
    await this.redis.setex(
      `heartbeat:${heartbeat.agentId}`,
      this.config.heartbeatInterval * 2,
      JSON.stringify(heartbeat)
    );

    this.logger.debug(`Heartbeat received from ${heartbeat.agentId}`);
  }

  async getSystemStats(): Promise<any> {
    return {
      totalAgents: this.agentRegistry.size,
      onlineAgents: Array.from(this.agentRegistry.values()).filter(a => a.isOnline).length,
      activeConnections: this.activeConnections.size,
      activeConversations: this.conversationContexts.size,
      pendingResponses: this.pendingResponses.size,
      metrics: this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  getConnectedWebSocketAgents(): string[] {
    return Array.from(this.activeConnections.keys());
  }

  async findAgentsByCapability(capabilityName: string): Promise<AgentRegistration[]> {
    return this.discoverAgents({ capabilities: [capabilityName] });
  }

  isAgentConnectedViaWebSocket(agentId: string): boolean {
    return this.activeConnections.has(agentId);
  }

  async onModuleDestroy(): Promise<void> {
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
}