import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  A2AMessage,
  A2AMessageSchema,
  AgentRegistration,
  AgentRegistrationSchema,
  AgentHeartbeat,
  AgentHeartbeatSchema,
  Conversation,
  ConversationSchema,
  AgentStatus,
  A2AMessageType,
  A2APriority,
  IA2ACommunicator,
  A2AConfig,
  A2AError,
  A2AValidationError,
  A2ATimeoutError,
  A2AConnectionError,
  A2AEvents
} from './types';

@Injectable()
export class A2ARedisAdapter extends EventEmitter implements IA2ACommunicator, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(A2ARedisAdapter.name);
  private readonly keyPrefix: string;
  private readonly requestTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly pendingRequests = new Map<string, {
    resolve: (value: A2AMessage) => void;
    reject: (reason: any) => void;
  }>();

  constructor(
    private readonly config: A2AConfig,
    private readonly redisService: UnifiedRedisService
  ) {
    super();
    this.keyPrefix = config.redis.keyPrefix || 'a2a:';
  }

  async onModuleInit() {
    try {
      // UnifiedRedisService handles connection management
      await this.setupSubscriptions();
      
      this.logger.log('A2A Redis Adapter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize A2A Redis Adapter:', error);
      throw new A2AConnectionError('Failed to connect to Redis');
    }
  }

  async onModuleDestroy() {
    // Clear all timeouts
    for (const timeout of this.requestTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.requestTimeouts.clear();
    
    // Reject pending requests
    for (const { reject } of this.pendingRequests.values()) {
      reject(new A2AError('Service shutting down', 'SHUTDOWN'));
    }
    this.pendingRequests.clear();

    // UnifiedRedisService handles connection cleanup
    this.logger.log('A2A Redis Adapter destroyed');
  }

  private async setupSubscriptions() {
    // Subscribe to global message channels using UnifiedRedisService
    const channels = [
      `${this.keyPrefix}messages:global`,
      `${this.keyPrefix}responses:global`,
      `${this.keyPrefix}heartbeats:global`,
      `${this.keyPrefix}events:global`
    ];

    for (const channel of channels) {
      await this.redisService.subscribe(channel, (message) => {
        this.handleRedisMessage(channel, JSON.stringify(message.message)).catch(error => {
          this.logger.error('Error handling Redis message:', error);
        });
      });
    }
  }

  private async handleRedisMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);

      if (channel.endsWith(':messages:global')) {
        const parsedMessage = A2AMessageSchema.parse(data);
        this.emit('message:received', parsedMessage);
        
        // Handle responses to pending requests
        if (parsedMessage.type === A2AMessageType.DATA_RESPONSE && parsedMessage.metadata?.originalMessageId) {
          this.handleResponse({ ...parsedMessage, payload: parsedMessage.payload || {} });
        }
      } else if (channel.endsWith(':heartbeats:global')) {
        const heartbeat = AgentHeartbeatSchema.parse(data);
        this.emit('heartbeat:received', heartbeat);
      } else if (channel.endsWith(':events:global')) {
        this.handleSystemEvent(data);
      }
    } catch (error) {
      this.logger.error('Failed to parse Redis message:', error);
    }
  }

  private handleResponse(response: A2AMessage) {
    const originalMessageId = response.metadata?.originalMessageId;
    if (!originalMessageId) return;
    
    const pending = this.pendingRequests.get(originalMessageId);
    if (pending) {
      const timeout = this.requestTimeouts.get(originalMessageId);
      if (timeout) {
        clearTimeout(timeout);
        this.requestTimeouts.delete(originalMessageId);
      }
      
      this.pendingRequests.delete(originalMessageId);
      pending.resolve(response);
    }
  }

  private handleSystemEvent(event: any) {
    const { type, data } = event;
    
    switch (type) {
      case 'agent:registered':
        this.emit('agent:registered', data);
        break;
      case 'agent:unregistered':
        this.emit('agent:unregistered', data);
        break;
      case 'agent:status_changed':
        this.emit('agent:status_changed', data.agentId, data.status);
        break;
      case 'conversation:started':
        this.emit('conversation:started', data);
        break;
      case 'conversation:ended':
        this.emit('conversation:ended', data);
        break;
      default:
        this.logger.warn(`Unknown system event type: ${type}`);
    }
  }

  async registerAgent(registration: AgentRegistration): Promise<void> {
    try {
      // Validate registration
      const validatedRegistration = AgentRegistrationSchema.parse(registration);
      
      // Store agent registration
      const agentKey = `${this.keyPrefix}agents:${validatedRegistration.agentId}`;
      await this.redisService.set(
        agentKey,
        JSON.stringify(validatedRegistration),
        this.config.redis.ttl || 3600
      );
      
      // Add to agents index
      await this.redisService.sadd(`${this.keyPrefix}agents:index`, validatedRegistration.agentId);
      
      // Set initial status
      await this.updateAgentStatus(validatedRegistration.agentId, AgentStatus.ONLINE);
      
      // Publish registration event
      await this.publishSystemEvent('agent:registered', validatedRegistration);
      
      this.logger.log(`Agent registered: ${validatedRegistration.agentId}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new A2AValidationError('Invalid agent registration', error.message);
      }
      throw error;
    }
  }

  async unregisterAgent(agentId: string): Promise<void> {
    // Remove agent data
    await this.redisService.del(`${this.keyPrefix}agents:${agentId}`);
    await this.redisService.del(`${this.keyPrefix}agents:${agentId}:status`);
    await this.redisService.del(`${this.keyPrefix}agents:${agentId}:heartbeat`);
    
    // Remove from index
    await this.redisService.srem(`${this.keyPrefix}agents:index`, agentId);
    
    // Publish unregistration event
    await this.publishSystemEvent('agent:unregistered', agentId);
    
    this.logger.log(`Agent unregistered: ${agentId}`);
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    const statusKey = `${this.keyPrefix}agents:${agentId}:status`;
    await this.redisService.set(statusKey, status, this.config.redis.ttl || 3600);
    
    // Publish status change event
    await this.publishSystemEvent('agent:status_changed', { agentId, status });
  }

  async sendMessage(message: A2AMessage): Promise<void> {
    try {
      // Ensure payload exists
      const messageWithPayload = {
        ...message,
        payload: message.payload ?? {},
        timestamp: message.timestamp || Date.now()
      };
      
      // Validate message
      const validatedMessage = A2AMessageSchema.parse(messageWithPayload);
      
      // Store message for audit/history
      await this.storeMessage({ ...validatedMessage, payload: validatedMessage.payload || {} });
      
      // Publish to appropriate channels using UnifiedRedisService
      if (validatedMessage.toAgent) {
        // Direct message
        await this.redisService.publish(
          `${this.keyPrefix}agents:${validatedMessage.toAgent}:messages`,
          { message: validatedMessage }
        );
      } else {
        // Broadcast
        await this.redisService.publish(
          `${this.keyPrefix}messages:global`,
          { message: validatedMessage }
        );
      }
      
      // Also publish to conversation channel if part of conversation
      if (validatedMessage.conversationId) {
        await this.redisService.publish(
          `${this.keyPrefix}conversations:${validatedMessage.conversationId}:messages`,
          { message: validatedMessage }
        );
      }
      
      this.logger.debug(`Message sent: ${validatedMessage.id}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new A2AValidationError('Invalid message format', error.message);
      }
      throw error;
    }
  }

  async sendRequest(
    fromAgent: string,
    toAgent: string,
    payload: any,
    options: {
      timeout?: number;
      priority?: A2APriority;
      conversationId?: string;
    } = {}
  ): Promise<A2AMessage> {
    const requestId = uuidv4();
    const timeout = options.timeout || 30000; // 30 seconds default

    const message: A2AMessage = {
      id: uuidv4(),
      timestamp: Date.now(),
      fromAgent,
      toAgent,
      type: A2AMessageType.DATA_REQUEST,
      priority: options.priority || A2APriority.MEDIUM,
      conversationId: options.conversationId,
      payload,
      metadata: { requestId }
    };

    // Set up response handling
    const responsePromise = new Promise<A2AMessage>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new A2ATimeoutError(`Request timeout after ${timeout}ms`, fromAgent));
      }, timeout);
      
      this.requestTimeouts.set(requestId, timeoutHandle);
    });

    // Send the request
    await this.sendMessage(message);

    return responsePromise;
  }

  async broadcast(
    fromAgent: string,
    payload: any,
    options: {
      channel?: string;
      topic?: string;
      priority?: A2APriority;
    } = {}
  ): Promise<void> {
    const message: A2AMessage = {
      id: uuidv4(),
      timestamp: Date.now(),
      fromAgent,
      toAgent: '*', // Broadcast
      type: A2AMessageType.DATA_REQUEST,
      priority: options.priority || A2APriority.MEDIUM,
      payload,
      metadata: {
        channel: options.channel,
        topic: options.topic
      }
    };

    await this.sendMessage(message);
  }

  async startConversation(initiator: string, participants: string[], topic?: string): Promise<string> {
    const conversation: Conversation = {
      id: uuidv4(),
      participants: [initiator, ...participants.filter(p => p !== initiator)],
      initiator,
      topic,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate conversation
    const validatedConversation = ConversationSchema.parse(conversation);

    // Store conversation
    const conversationKey = `${this.keyPrefix}conversations:${validatedConversation.id}`;
    await this.redisService.set(
      conversationKey,
      JSON.stringify(validatedConversation),
      this.config.redis.ttl || 3600
    );

    // Add participants to conversation
    for (const participant of validatedConversation.participants) {
      await this.redisService.sadd(
        `${this.keyPrefix}agents:${participant}:conversations`,
        validatedConversation.id
      );
    }

    // Publish conversation started event
    await this.publishSystemEvent('conversation:started', validatedConversation);

    this.logger.log(`Conversation started: ${validatedConversation.id}`);
    return validatedConversation.id;
  }

  async joinConversation(conversationId: string, agentId: string): Promise<void> {
    const conversationKey = `${this.keyPrefix}conversations:${conversationId}`;
    const conversationData = await this.redisService.get(conversationKey);
    
    if (!conversationData) {
      throw new A2AError('Conversation not found', 'NOT_FOUND');
    }

    const conversation = JSON.parse(conversationData) as Conversation;
    
    if (!conversation.participants.includes(agentId)) {
      conversation.participants.push(agentId);
      conversation.updatedAt = new Date().toISOString();
      
      // Update conversation
      await this.redisService.set(conversationKey, JSON.stringify(conversation), this.config.redis.ttl || 3600);
      
      // Add agent to conversation
      await this.redisService.sadd(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
    }
  }

  async leaveConversation(conversationId: string, agentId: string): Promise<void> {
    const conversationKey = `${this.keyPrefix}conversations:${conversationId}`;
    const conversationData = await this.redisService.get(conversationKey);
    
    if (!conversationData) {
      return; // Conversation doesn't exist, nothing to do
    }

    const conversation = JSON.parse(conversationData) as Conversation;
    conversation.participants = conversation.participants.filter(p => p !== agentId);
    conversation.updatedAt = new Date().toISOString();
    
    if (conversation.participants.length === 0) {
      // End conversation if no participants left
      conversation.status = 'completed';
      await this.publishSystemEvent('conversation:ended', conversationId);
    }
    
    // Update conversation
    await this.redisService.set(conversationKey, JSON.stringify(conversation), this.config.redis.ttl || 3600);
    
    // Remove agent from conversation
    await this.redisService.srem(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
  }

  async discoverAgents(criteria: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  } = {}): Promise<AgentRegistration[]> {
    const agentIds = await this.redisService.smembers(`${this.keyPrefix}agents:index`);
    const agents: AgentRegistration[] = [];

    for (const agentId of agentIds) {
      const agentData = await this.redisService.get(`${this.keyPrefix}agents:${agentId}`);
      if (!agentData) continue;

      try {
        const agent = JSON.parse(agentData) as AgentRegistration;
        
        // Apply filters
        if (criteria.type && agent.type !== criteria.type) continue;
        
        if (criteria.status) {
          const status = await this.redisService.get(`${this.keyPrefix}agents:${agentId}:status`);
          if (status !== criteria.status) continue;
        }
        
        if (criteria.capabilities && criteria.capabilities.length > 0) {
          const hasAllCapabilities = criteria.capabilities.every(cap =>
            agent.capabilities.some(agentCap => agentCap === cap)
          );
          if (!hasAllCapabilities) continue;
        }
        
        agents.push(agent);
      } catch (error) {
        this.logger.warn(`Failed to parse agent data for ${agentId}:`, error);
      }
    }

    return agents;
  }

  async sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    try {
      const validatedHeartbeat = AgentHeartbeatSchema.parse(heartbeat);
      
      // Store heartbeat
      const heartbeatKey = `${this.keyPrefix}agents:${validatedHeartbeat.agentId}:heartbeat`;
      await this.redisService.set(
        heartbeatKey,
        JSON.stringify(validatedHeartbeat),
        this.config.redis.ttl || 3600
      );
      
      // Publish heartbeat
      await this.redisService.publish(
        `${this.keyPrefix}heartbeats:global`,
        { message: JSON.stringify(validatedHeartbeat) }
      );
      
      // Update agent status based on heartbeat
      await this.updateAgentStatus(validatedHeartbeat.agentId, validatedHeartbeat.status);
    } catch (error) {
      if (error instanceof Error) {
        throw new A2AValidationError('Invalid heartbeat format', error.message);
      }
      throw error;
    }
  }

  async getAgentHealth(agentId: string): Promise<AgentHeartbeat | null> {
    const heartbeatData = await this.redisService.get(`${this.keyPrefix}agents:${agentId}:heartbeat`);
    if (!heartbeatData) return null;

    try {
      return JSON.parse(heartbeatData) as AgentHeartbeat;
    } catch (error) {
      this.logger.warn(`Failed to parse heartbeat data for ${agentId}:`, error);
      return null;
    }
  }

  private async storeMessage(message: A2AMessage): Promise<void> {
    // Store message with TTL for audit/history
    const messageKey = `${this.keyPrefix}messages:${message.id}`;
    await this.redisService.set(
      messageKey,
      JSON.stringify(message),
      this.config.redis.ttl || 3600
    );
    
    // Add to conversation history if applicable
    if (message.conversationId) {
      await this.redisService.lpush(
        `${this.keyPrefix}conversations:${message.conversationId}:history`,
        message.id
      );
      // Keep only recent messages in conversation history
      await this.redisService.ltrim(
        `${this.keyPrefix}conversations:${message.conversationId}:history`,
        0,
        999 // Keep last 1000 messages
      );
    }
  }

  private async publishSystemEvent(type: string, data: any): Promise<void> {
    await this.redisService.publish(
      `${this.keyPrefix}events:global`,
      { message: { type, data, timestamp: Date.now() } }
    );
  }
}
