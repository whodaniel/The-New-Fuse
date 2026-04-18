import { Injectable, Logger } from '@nestjs/common';
import { 
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
// @ts-ignore
import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'events';
import { 
  A2AMessage, 
  A2AMessageSchema, 
  AgentRegistration, 
  AgentHeartbeat,
  A2AMessageType,
  AgentStatus,
  A2AConfig,
  A2AError,
  A2AValidationError,
  IA2ACommunicator
} from './types.js';
import { A2ARedisAdapter } from './redis-adapter.js';

// A2ASocket type is now replaced with any locally
@Injectable()
@NestWebSocketGateway({
  namespace: '/a2a',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling']
})
export class A2AWebSocketAdapter extends EventEmitter implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(A2AWebSocketAdapter.name);
  private readonly connectedAgents = new Map<string, any>(); // agentId -> socket
  private readonly socketToAgent = new Map<string, string>(); // socketId -> agentId

  constructor(
    private readonly config: A2AConfig,
    private readonly redisAdapter: A2ARedisAdapter
  ) {
    super();
    this.setupRedisSubscriptions();
  }

  private setupRedisSubscriptions() {
    // Forward Redis events to WebSocket clients
    this.redisAdapter.on('message:received', (message: A2AMessage) => {
      this.forwardMessageToWebSocket(message);
    });

    this.redisAdapter.on('agent:registered', (registration: AgentRegistration) => {
      this.server.emit('agent:registered', registration);
    });

    this.redisAdapter.on('agent:unregistered', (agentId: string) => {
      this.server.emit('agent:unregistered', { agentId });
      // Disconnect the agent if connected
      const socket = this.connectedAgents.get(agentId);
      if (socket) {
        socket.disconnect();
      }
    });

    this.redisAdapter.on('agent:status_changed', (agentId: string, status: AgentStatus) => {
      this.server.emit('agent:status_changed', { agentId, status });
    });

    this.redisAdapter.on('heartbeat:received', (heartbeat: AgentHeartbeat) => {
      this.server.emit('heartbeat:received', heartbeat);
    });
  }

  async handleConnection(client: any) {
    this.logger.log(`Client connecting: ${client.id}`);
    
    try {
      // Wait for authentication
      const authTimeout = setTimeout(() => {
        if (!client.isAuthenticated) {
          this.logger.warn(`Client ${client.id} authentication timeout`);
          client.emit('error', { code: 'AUTH_TIMEOUT', message: 'Authentication timeout' });
          client.disconnect();
        }
      }, 10000); // 10 second auth timeout

      client.on('disconnect', () => {
        clearTimeout(authTimeout);
      });

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.emit('error', { code: 'CONNECTION_ERROR', message: 'Failed to establish connection' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: any) {
    const agentId = this.socketToAgent.get(client.id);
    
    if (agentId) {
      this.logger.log(`Agent disconnected: ${agentId} (${client.id})`);
      
      // Clean up mappings
      this.connectedAgents.delete(agentId);
      this.socketToAgent.delete(client.id);
      
      // Update agent status to offline
      try {
        await this.redisAdapter.updateAgentStatus(agentId, AgentStatus.OFFLINE);
      } catch (error) {
        this.logger.error(`Failed to update agent status on disconnect:`, error);
      }
      
      // Emit disconnection event
      this.server.emit('agent:disconnected', { agentId });
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: any,
    @MessageBody() data: { agentId: string; token?: string; signature?: string }
  ) {
    try {
      // Basic validation
      if (!data.agentId) {
        throw new A2AValidationError('Agent ID is required', 'agentId');
      }

      // TODO: Implement proper authentication based on config
      // For now, we'll do basic validation
      const isValid = await this.validateAgent(data.agentId, data.token, data.signature);
      
      if (!isValid) {
        client.emit('authentication:failed', { 
          code: 'INVALID_CREDENTIALS', 
          message: 'Invalid authentication credentials' 
        });
        client.disconnect();
        return;
      }

      // Check if agent is already connected
      const existingSocket = this.connectedAgents.get(data.agentId);
      if (existingSocket && existingSocket.connected) {
        this.logger.warn(`Agent ${data.agentId} already connected, disconnecting previous connection`);
        existingSocket.disconnect();
      }

      // Register the connection
      client.agentId = data.agentId;
      client.isAuthenticated = true;
      this.connectedAgents.set(data.agentId, client);
      this.socketToAgent.set(client.id, data.agentId);

      // Subscribe to agent-specific channels
      client.join(`agent:${data.agentId}`);
      client.join('global');

      // Update agent status to online
      await this.redisAdapter.updateAgentStatus(data.agentId, AgentStatus.ONLINE);

      // Send authentication success
      client.emit('authentication:success', { 
        agentId: data.agentId,
        timestamp: Date.now()
      });

      this.logger.log(`Agent authenticated: ${data.agentId} (${client.id})`);

    } catch (error) {
      this.logger.error('Authentication error:', error);
      client.emit('authentication:failed', { 
        code: 'AUTH_ERROR', 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      });
      client.disconnect();
    }
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(
    @ConnectedSocket() client: any,
    @MessageBody() data: A2AMessage
  ) {
    try {
      if (!client.isAuthenticated || !client.agentId) {
        throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      // Validate the message
      const validatedMessage = A2AMessageSchema.parse({
        ...data,
        payload: data.payload ?? {},
        fromAgent: client.agentId, // Ensure fromAgent matches authenticated agent
        timestamp: Date.now()
      });

      // Send through Redis adapter
      await this.redisAdapter.sendMessage({ ...validatedMessage, payload: validatedMessage.payload || {} });

      // Acknowledge message sent
      client.emit('message:sent', { 
        messageId: validatedMessage.id, 
        timestamp: validatedMessage.timestamp 
      });

    } catch (error) {
      this.logger.error('Send message error:', error);
      client.emit('message:error', { 
        code: error instanceof A2AError ? error.code : 'SEND_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  }

  @SubscribeMessage('send:request')
  async handleSendRequest(
    @ConnectedSocket() client: any,
    @MessageBody() data: {
      toAgent: string;
      payload: any;
      timeout?: number;
      conversationId?: string;
    }
  ) {
    try {
      if (!client.isAuthenticated || !client.agentId) {
        throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      const response = await this.redisAdapter.sendRequest(
        client.agentId,
        data.toAgent,
        data.payload,
        {
          timeout: data.timeout,
          conversationId: data.conversationId
        }
      );

      client.emit('request:response', response);

    } catch (error) {
      this.logger.error('Send request error:', error);
      client.emit('request:error', { 
        code: error instanceof A2AError ? error.code : 'REQUEST_ERROR',
        message: error instanceof Error ? error.message : 'Request failed'
      });
    }
  }

  @SubscribeMessage('send:broadcast')
  async handleSendBroadcast(
    @ConnectedSocket() client: any,
    @MessageBody() data: {
      payload: any;
      channel?: string;
      topic?: string;
    }
  ) {
    try {
      if (!client.isAuthenticated || !client.agentId) {
        throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      await this.redisAdapter.broadcast(client.agentId, data.payload, {
        channel: data.channel,
        topic: data.topic
      });

      client.emit('broadcast:sent', { 
        timestamp: Date.now() 
      });

    } catch (error) {
      this.logger.error('Send broadcast error:', error);
      client.emit('broadcast:error', { 
        code: error instanceof A2AError ? error.code : 'BROADCAST_ERROR',
        message: error instanceof Error ? error.message : 'Broadcast failed'
      });
    }
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: any,
    @MessageBody() data: { conversationId: string }
  ) {
    try {
      if (!client.isAuthenticated || !client.agentId) {
        throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      await this.redisAdapter.joinConversation(data.conversationId, client.agentId);
      client.join(`conversation:${data.conversationId}`);

      client.emit('conversation:joined', { 
        conversationId: data.conversationId,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logger.error('Join conversation error:', error);
      client.emit('conversation:error', { 
        code: error instanceof A2AError ? error.code : 'CONVERSATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to join conversation'
      });
    }
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: any,
    @MessageBody() data: { conversationId: string }
  ) {
    try {
      if (!client.isAuthenticated || !client.agentId) {
        throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      await this.redisAdapter.leaveConversation(data.conversationId, client.agentId);
      client.leave(`conversation:${data.conversationId}`);

      client.emit('conversation:left', { 
        conversationId: data.conversationId,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logger.error('Leave conversation error:', error);
      client.emit('conversation:error', { 
        code: error instanceof A2AError ? error.code : 'CONVERSATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to leave conversation'
      });
    }
  }

  @SubscribeMessage('discover:agents')
  async handleDiscoverAgents(
    @ConnectedSocket() client: any,
    @MessageBody() data: {
      type?: string;
      capabilities?: string[];
      status?: AgentStatus;
    }
  ) {
    try {
      if (!client.isAuthenticated || !client.agentId) {
        throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      const agents = await this.redisAdapter.discoverAgents(data);
      client.emit('agents:discovered', agents);

    } catch (error) {
      this.logger.error('Discover agents error:', error);
      client.emit('discovery:error', { 
        code: error instanceof A2AError ? error.code : 'DISCOVERY_ERROR',
        message: error instanceof Error ? error.message : 'Agent discovery failed'
      });
    }
  }

  @SubscribeMessage('send:heartbeat')
  async handleSendHeartbeat(
    @ConnectedSocket() client: any,
    @MessageBody() data: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>
  ) {
    try {
      if (!client.isAuthenticated || !client.agentId) {
        throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      const heartbeat: AgentHeartbeat = {
        ...data,
        agentId: client.agentId,
        timestamp: new Date().toISOString()
      };

      await this.redisAdapter.sendHeartbeat(heartbeat);

      client.emit('heartbeat:sent', { 
        timestamp: heartbeat.timestamp 
      });

    } catch (error) {
      this.logger.error('Send heartbeat error:', error);
      client.emit('heartbeat:error', { 
        code: error instanceof A2AError ? error.code : 'HEARTBEAT_ERROR',
        message: error instanceof Error ? error.message : 'Heartbeat failed'
      });
    }
  }

  // Forward Redis messages to appropriate WebSocket clients
  private forwardMessageToWebSocket(message: A2AMessage) {
    if (message.toAgent) {
      // Direct message to specific agent
      const targetSocket = this.connectedAgents.get(message.toAgent);
      if (targetSocket && targetSocket.connected) {
        targetSocket.emit('message:received', message);
      }
    } else {
      // Broadcast to all connected agents (or filtered by routing)
      if (message.metadata?.channel) {
        this.server.to(message.metadata.channel).emit('message:received', message);
      } else {
        this.server.to('global').emit('message:received', message);
      }
    }

    // Also send to conversation participants if applicable
    if (message.conversationId) {
      this.server.to(`conversation:${message.conversationId}`).emit('message:received', message);
    }
  }

  // Validate agent authentication
  private async validateAgent(agentId: string, token?: string, signature?: string): Promise<boolean> {
    try {
      // Check if agent exists in Redis
      const agentData = await this.redisAdapter.discoverAgents({ type: undefined });
      const agent = agentData.find(a => a.agentId === agentId);
      
      if (!agent) {
        this.logger.warn(`Authentication failed: Agent ${agentId} not found`);
        return false;
      }

      // TODO: Implement proper token/signature validation based on agent.authentication
      // For now, we'll accept any registered agent
      return true;

    } catch (error) {
      this.logger.error('Agent validation error:', error);
      return false;
    }
  }

  // Public methods for external access
  public getConnectedAgents(): string[] {
    return Array.from(this.connectedAgents.keys());
  }

  public isAgentConnected(agentId: string): boolean {
    const socket = this.connectedAgents.get(agentId);
    return socket ? socket.connected : false;
  }

  public async sendDirectMessage(message: A2AMessage): Promise<void> {
    this.forwardMessageToWebSocket(message);
  }
}
