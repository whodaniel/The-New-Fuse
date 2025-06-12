import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  A2AMessage,
  AgentRegistration,
  AgentHeartbeat,
  Conversation,
  AgentStatus,
  MessageType,
  Priority,
  IA2ACommunicator,
  A2AConfig,
  A2AError,
  A2AEvents
} from './types';
import { A2ARedisAdapter } from './redis-adapter';
import { A2AWebSocketAdapter } from './websocket-adapter';

@Injectable()
export class A2AService extends EventEmitter implements IA2ACommunicator, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(A2AService.name);
  private isInitialized = false;

  constructor(
    private readonly config: A2AConfig,
    private readonly redisAdapter: A2ARedisAdapter,
    private readonly websocketAdapter?: A2AWebSocketAdapter
  ) {
    super();
    this.setupEventForwarding();
  }

  async onModuleInit() {
    try {
      await this.redisAdapter.onModuleInit();
      
      if (this.websocketAdapter) {
        // WebSocket adapter is initialized by NestJS automatically
        this.logger.log('WebSocket adapter available');
      }

      this.isInitialized = true;
      this.logger.log('A2A Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize A2A Service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.isInitialized = false;
    
    if (this.redisAdapter) {
      await this.redisAdapter.onModuleDestroy();
    }
    
    this.logger.log('A2A Service destroyed');
  }

  private setupEventForwarding() {
    // Forward events from Redis adapter
    const eventsToForward: (keyof A2AEvents)[] = [
      'agent:registered',
      'agent:unregistered', 
      'agent:status_changed',
      'message:received',
      'conversation:started',
      'conversation:ended',
      'heartbeat:received',
      'error'
    ];

    eventsToForward.forEach(event => {
      this.redisAdapter.on(event as string, (...args: any[]) => {
        this.emit(event as string, ...args);
      });
    });
  }

  private ensureInitialized() {
    if (!this.isInitialized) {
      throw new A2AError('A2A Service not initialized', 'NOT_INITIALIZED');
    }
  }

  // Agent Registration
  async registerAgent(registration: AgentRegistration): Promise<void> {
    this.ensureInitialized();
    
    this.logger.log(`Registering agent: ${registration.agentId} (${registration.name})`);
    await this.redisAdapter.registerAgent(registration);
    
    // Start automatic heartbeat if agent supports it
    if (registration.metadata?.autoHeartbeat) {
      this.startAutoHeartbeat(registration.agentId);
    }
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.ensureInitialized();
    
    this.logger.log(`Unregistering agent: ${agentId}`);
    this.stopAutoHeartbeat(agentId);
    await this.redisAdapter.unregisterAgent(agentId);
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    this.ensureInitialized();
    await this.redisAdapter.updateAgentStatus(agentId, status);
  }

  // Messaging
  async sendMessage(message: A2AMessage): Promise<void> {
    this.ensureInitialized();
    
    // Add ID and timestamp if not provided
    if (!message.id) {
      message.id = uuidv4();
    }
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    await this.redisAdapter.sendMessage(message);
    
    // Also send via WebSocket if available and target agent is connected
    if (this.websocketAdapter && message.toAgent) {
      if (this.websocketAdapter.isAgentConnected(message.toAgent)) {
        await this.websocketAdapter.sendDirectMessage(message);
      }
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
    this.ensureInitialized();
    
    this.logger.debug(`Sending request from ${fromAgent} to ${toAgent}`);
    return await this.redisAdapter.sendRequest(fromAgent, toAgent, payload, options);
  }

  async sendResponse(
    originalMessage: A2AMessage,
    responsePayload: any,
    fromAgent: string
  ): Promise<void> {
    this.ensureInitialized();

    const response: A2AMessage = {
      id: uuidv4(),
      protocolVersion: originalMessage.protocolVersion,
      timestamp: new Date().toISOString(),
      fromAgent,
      toAgent: originalMessage.fromAgent,
      type: MessageType.RESPONSE,
      priority: originalMessage.priority,
      conversationId: originalMessage.conversationId,
      requestId: originalMessage.requestId,
      payload: responsePayload
    };

    await this.sendMessage(response);
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
    this.ensureInitialized();
    
    this.logger.debug(`Broadcasting from ${fromAgent} to channel: ${options.channel || 'global'}`);
    await this.redisAdapter.broadcast(fromAgent, payload, options);
  }

  // Conversations
  async startConversation(initiator: string, participants: string[], topic?: string): Promise<string> {
    this.ensureInitialized();
    
    this.logger.log(`Starting conversation between ${participants.join(', ')} (initiated by ${initiator})`);
    return await this.redisAdapter.startConversation(initiator, participants, topic);
  }

  async joinConversation(conversationId: string, agentId: string): Promise<void> {
    this.ensureInitialized();
    await this.redisAdapter.joinConversation(conversationId, agentId);
  }

  async leaveConversation(conversationId: string, agentId: string): Promise<void> {
    this.ensureInitialized();
    await this.redisAdapter.leaveConversation(conversationId, agentId);
  }

  // Discovery
  async discoverAgents(criteria: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  } = {}): Promise<AgentRegistration[]> {
    this.ensureInitialized();
    return await this.redisAdapter.discoverAgents(criteria);
  }

  async findAgentsByCapability(capabilityName: string): Promise<AgentRegistration[]> {
    return await this.discoverAgents({ capabilities: [capabilityName] });
  }

  async getOnlineAgents(): Promise<AgentRegistration[]> {
    return await this.discoverAgents({ status: AgentStatus.ONLINE });
  }

  // Health and Monitoring
  async sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    this.ensureInitialized();
    await this.redisAdapter.sendHeartbeat(heartbeat);
  }

  async getAgentHealth(agentId: string): Promise<AgentHeartbeat | null> {
    this.ensureInitialized();
    return await this.redisAdapter.getAgentHealth(agentId);
  }

  // High-level helper methods
  async createAgentCommunicationChannel(agentIds: string[], topic?: string): Promise<string> {
    if (agentIds.length < 2) {
      throw new A2AError('At least 2 agents required for communication channel', 'INVALID_PARTICIPANTS');
    }

    const initiator = agentIds[0];
    const participants = agentIds.slice(1);
    
    return await this.startConversation(initiator, participants, topic);
  }

  async facilitateAgentHandshake(agent1Id: string, agent2Id: string): Promise<void> {
    // Get agent information
    const agents = await this.discoverAgents();
    const agent1 = agents.find(a => a.agentId === agent1Id);
    const agent2 = agents.find(a => a.agentId === agent2Id);

    if (!agent1 || !agent2) {
      throw new A2AError('One or both agents not found', 'AGENT_NOT_FOUND');
    }

    // Send handshake messages
    const handshake1to2: A2AMessage = {
      id: uuidv4(),
      protocolVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      fromAgent: agent1Id,
      toAgent: agent2Id,
      type: MessageType.HANDSHAKE,
      priority: Priority.HIGH,
      payload: {
        agentInfo: {
          name: agent1.name,
          type: agent1.type,
          capabilities: agent1.capabilities
        },
        purpose: 'agent_introduction'
      }
    };

    const handshake2to1: A2AMessage = {
      id: uuidv4(),
      protocolVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      fromAgent: agent2Id,
      toAgent: agent1Id,
      type: MessageType.HANDSHAKE,
      priority: Priority.HIGH,
      payload: {
        agentInfo: {
          name: agent2.name,
          type: agent2.type,
          capabilities: agent2.capabilities
        },
        purpose: 'agent_introduction'
      }
    };

    await Promise.all([
      this.sendMessage(handshake1to2),
      this.sendMessage(handshake2to1)
    ]);

    this.logger.log(`Facilitated handshake between ${agent1.name} and ${agent2.name}`);
  }

  async routeMessageByCapability(
    fromAgent: string,
    targetCapability: string,
    payload: any,
    options: {
      priority?: Priority;
      preferredAgent?: string;
    } = {}
  ): Promise<void> {
    // Find agents with the required capability
    const capableAgents = await this.findAgentsByCapability(targetCapability);
    
    if (capableAgents.length === 0) {
      throw new A2AError(`No agents found with capability: ${targetCapability}`, 'NO_CAPABLE_AGENTS');
    }

    // Select target agent (prefer specified agent, otherwise pick first available)
    let targetAgent = capableAgents.find(a => a.agentId === options.preferredAgent);
    if (!targetAgent) {
      // Find online agents first
      const onlineAgents = capableAgents.filter(async a => {
        const health = await this.getAgentHealth(a.agentId);
        return health?.status === AgentStatus.ONLINE;
      });
      
      targetAgent = onlineAgents.length > 0 ? onlineAgents[0] : capableAgents[0];
    }

    const message: A2AMessage = {
      id: uuidv4(),
      protocolVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      fromAgent,
      toAgent: targetAgent.agentId,
      type: MessageType.REQUEST,
      priority: options.priority || Priority.MEDIUM,
      payload,
      routing: {
        targetCapability
      }
    };

    await this.sendMessage(message);
  }

  // Auto-heartbeat management
  private readonly heartbeatIntervals = new Map<string, NodeJS.Timeout>();

  private startAutoHeartbeat(agentId: string) {
    if (this.heartbeatIntervals.has(agentId)) {
      return; // Already running
    }

    const interval = setInterval(async () => {
      try {
        const heartbeat: AgentHeartbeat = {
          agentId,
          timestamp: new Date().toISOString(),
          status: AgentStatus.ONLINE,
          lastActivity: new Date().toISOString()
        };
        
        await this.sendHeartbeat(heartbeat);
      } catch (error) {
        this.logger.error(`Failed to send auto-heartbeat for agent ${agentId}:`, error);
      }
    }, this.config.monitoring?.heartbeatInterval || 30000);

    this.heartbeatIntervals.set(agentId, interval);
  }

  private stopAutoHeartbeat(agentId: string) {
    const interval = this.heartbeatIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(agentId);
    }
  }

  // Statistics and monitoring
  async getSystemStats(): Promise<{
    totalAgents: number;
    onlineAgents: number;
    activeConversations: number;
    messagesInLastHour: number;
  }> {
    this.ensureInitialized();
    
    const allAgents = await this.discoverAgents();
    const onlineAgents = await this.getOnlineAgents();
    
    // TODO: Implement conversation and message counting
    return {
      totalAgents: allAgents.length,
      onlineAgents: onlineAgents.length,
      activeConversations: 0, // Placeholder
      messagesInLastHour: 0   // Placeholder
    };
  }

  // Connection status
  getConnectedWebSocketAgents(): string[] {
    return this.websocketAdapter ? this.websocketAdapter.getConnectedAgents() : [];
  }

  isAgentConnectedViaWebSocket(agentId: string): boolean {
    return this.websocketAdapter ? this.websocketAdapter.isAgentConnected(agentId) : false;
  }
}
