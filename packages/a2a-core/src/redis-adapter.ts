import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
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
  MessageType,
  Priority,
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
  private client: Redis;
  private pubClient: Redis;
  private subClient: Redis;
  private readonly keyPrefix: string;
  private readonly requestTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly pendingRequests = new Map<string, {
    resolve: (value: A2AMessage) => void;
    reject: (reason: any) => void;
  }>();

  constructor(private readonly config: A2AConfig) {
    super();
    this.keyPrefix = config.redis.keyPrefix || 'a2a:';
    
    // Initialize Redis clients
    const redisConfig = { 
      ...config.redis,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };
    
    this.client = new Redis(redisConfig);
    this.pubClient = new Redis(redisConfig);
    this.subClient = new Redis(redisConfig);
  }

  async onModuleInit() {
    try {
      await Promise.all([
        this.client.connect(),
        this.pubClient.connect(),
        this.subClient.connect()
      ]);

      // Subscribe to global A2A channels
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

    // Disconnect Redis clients
    await Promise.all([
      this.client.disconnect(),
      this.pubClient.disconnect(),
      this.subClient.disconnect()
    ]);
    
    this.logger.log('A2A Redis Adapter destroyed');
  }

  private async setupSubscriptions() {
    // Subscribe to global message channels
    await this.subClient.subscribe(
      `${this.keyPrefix}messages:global`,
      `${this.keyPrefix}responses:global`,
      `${this.keyPrefix}heartbeats:global`,
      `${this.keyPrefix}events:global`
    );

    this.subClient.on('message', (channel, message) => {
      this.handleRedisMessage(channel, message).catch(error => {
        this.logger.error('Error handling Redis message:', error);
      });
    });
  }

  private async handleRedisMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);

      if (channel.endsWith(':messages:global')) {
        const parsedMessage = A2AMessageSchema.parse(data);
        this.emit('message:received', parsedMessage);
        
        // Handle responses to pending requests
        if (parsedMessage.type === MessageType.RESPONSE && parsedMessage.requestId) {
          this.handleResponse(parsedMessage);
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
    const pending = this.pendingRequests.get(response.requestId!);
    if (pending) {
      const timeout = this.requestTimeouts.get(response.requestId!);
      if (timeout) {
        clearTimeout(timeout);
        this.requestTimeouts.delete(response.requestId!);
      }
      
      this.pendingRequests.delete(response.requestId!);
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
      await this.client.setex(
        agentKey,
        this.config.redis.ttl || 3600,
        JSON.stringify(validatedRegistration)
      );
      
      // Add to agents index
      await this.client.sadd(`${this.keyPrefix}agents:index`, validatedRegistration.agentId);
      
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
    await this.client.del(`${this.keyPrefix}agents:${agentId}`);
    await this.client.del(`${this.keyPrefix}agents:${agentId}:status`);
    await this.client.del(`${this.keyPrefix}agents:${agentId}:heartbeat`);
    
    // Remove from index
    await this.client.srem(`${this.keyPrefix}agents:index`, agentId);
    
    // Publish unregistration event
    await this.publishSystemEvent('agent:unregistered', agentId);
    
    this.logger.log(`Agent unregistered: ${agentId}`);
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    const statusKey = `${this.keyPrefix}agents:${agentId}:status`;
    await this.client.setex(statusKey, this.config.redis.ttl || 3600, status);
    
    // Publish status change event
    await this.publishSystemEvent('agent:status_changed', { agentId, status });
  }

  async sendMessage(message: A2AMessage): Promise<void> {
    try {
      // Validate message
      const validatedMessage = A2AMessageSchema.parse(message);
      
      // Add timestamp if not provided
      if (!validatedMessage.timestamp) {
        validatedMessage.timestamp = new Date().toISOString();
      }
      
      // Store message for audit/history
      await this.storeMessage(validatedMessage);
      
      // Publish to appropriate channels
      if (validatedMessage.toAgent) {
        // Direct message
        await this.pubClient.publish(
          `${this.keyPrefix}agents:${validatedMessage.toAgent}:messages`,
          JSON.stringify(validatedMessage)
        );
      } else {
        // Broadcast
        await this.pubClient.publish(
          `${this.keyPrefix}messages:global`,
          JSON.stringify(validatedMessage)
        );
      }
      
      // Also publish to conversation channel if part of conversation
      if (validatedMessage.conversationId) {
        await this.pubClient.publish(
          `${this.keyPrefix}conversations:${validatedMessage.conversationId}:messages`,
          JSON.stringify(validatedMessage)
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
      priority?: Priority;
      conversationId?: string;
    } = {}
  ): Promise<A2AMessage> {
    const requestId = uuidv4();
    const timeout = options.timeout || 30000; // 30 seconds default

    const message: A2AMessage = {
      id: uuidv4(),
      protocolVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      fromAgent,
      toAgent,
      type: MessageType.REQUEST,
      priority: options.priority || Priority.MEDIUM,
      conversationId: options.conversationId,
      requestId,
      payload
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
      priority?: Priority;
    } = {}
  ): Promise<void> {
    const message: A2AMessage = {
      id: uuidv4(),
      protocolVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      fromAgent,
      type: MessageType.BROADCAST,
      priority: options.priority || Priority.MEDIUM,
      payload,
      routing: {
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
    await this.client.setex(
      conversationKey,
      this.config.redis.ttl || 3600,
      JSON.stringify(validatedConversation)
    );

    // Add participants to conversation
    for (const participant of validatedConversation.participants) {
      await this.client.sadd(
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
    const conversationData = await this.client.get(conversationKey);
    
    if (!conversationData) {
      throw new A2AError('Conversation not found', 'NOT_FOUND');
    }

    const conversation = JSON.parse(conversationData) as Conversation;
    
    if (!conversation.participants.includes(agentId)) {
      conversation.participants.push(agentId);
      conversation.updatedAt = new Date().toISOString();
      
      // Update conversation
      await this.client.setex(conversationKey, this.config.redis.ttl || 3600, JSON.stringify(conversation));
      
      // Add agent to conversation
      await this.client.sadd(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
    }
  }

  async leaveConversation(conversationId: string, agentId: string): Promise<void> {
    const conversationKey = `${this.keyPrefix}conversations:${conversationId}`;
    const conversationData = await this.client.get(conversationKey);
    
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
    await this.client.setex(conversationKey, this.config.redis.ttl || 3600, JSON.stringify(conversation));
    
    // Remove agent from conversation
    await this.client.srem(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
  }

  async discoverAgents(criteria: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  } = {}): Promise<AgentRegistration[]> {
    const agentIds = await this.client.smembers(`${this.keyPrefix}agents:index`);
    const agents: AgentRegistration[] = [];

    for (const agentId of agentIds) {
      const agentData = await this.client.get(`${this.keyPrefix}agents:${agentId}`);
      if (!agentData) continue;

      try {
        const agent = JSON.parse(agentData) as AgentRegistration;
        
        // Apply filters
        if (criteria.type && agent.type !== criteria.type) continue;
        
        if (criteria.status) {
          const status = await this.client.get(`${this.keyPrefix}agents:${agentId}:status`);
          if (status !== criteria.status) continue;
        }
        
        if (criteria.capabilities && criteria.capabilities.length > 0) {
          const hasAllCapabilities = criteria.capabilities.every(cap =>
            agent.capabilities.some(agentCap => agentCap.name === cap)
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
      await this.client.setex(
        heartbeatKey,
        this.config.monitoring?.heartbeatInterval || 60,
        JSON.stringify(validatedHeartbeat)
      );
      
      // Publish heartbeat
      await this.pubClient.publish(
        `${this.keyPrefix}heartbeats:global`,
        JSON.stringify(validatedHeartbeat)
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
    const heartbeatData = await this.client.get(`${this.keyPrefix}agents:${agentId}:heartbeat`);
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
    await this.client.setex(
      messageKey,
      this.config.redis.ttl || 3600,
      JSON.stringify(message)
    );
    
    // Add to conversation history if applicable
    if (message.conversationId) {
      await this.client.lpush(
        `${this.keyPrefix}conversations:${message.conversationId}:history`,
        message.id
      );
      // Keep only recent messages in conversation history
      await this.client.ltrim(
        `${this.keyPrefix}conversations:${message.conversationId}:history`,
        0,
        999 // Keep last 1000 messages
      );
    }
  }

  private async publishSystemEvent(type: string, data: any): Promise<void> {
    await this.pubClient.publish(
      `${this.keyPrefix}events:global`,
      JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    );
  }
}
