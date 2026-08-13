/**
 * Relay Gateway - WebSocket Gateway for Real-time Agent Communication
 *
 * Provides WebSocket interface for:
 * - Real-time agent registration
 * - Live message routing
 * - Status updates
 */

import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RelayService } from './relay.service';

interface AgentSocket extends Socket {
  agentId?: string;
}

@WebSocketGateway({
  namespace: '/relay',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class RelayGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RelayGateway.name);
  private connectedAgents: Map<string, string> = new Map(); // socketId -> agentId

  constructor(
    private readonly relayService: RelayService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  afterInit(server: Server) {
    this.logger.log('Relay WebSocket Gateway initialized');
  }

  handleConnection(client: AgentSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', {
      message: 'Connected to The New Fuse Relay',
      socketId: client.id,
    });
  }

  handleDisconnect(client: AgentSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Unregister agent if it was registered
    const agentId = this.connectedAgents.get(client.id);
    if (agentId) {
      this.relayService.unregisterAgent(agentId);
      this.connectedAgents.delete(client.id);
      this.server.emit('agent:disconnected', { agentId });
    }
  }

  // ========================================
  // Agent Registration
  // ========================================

  @SubscribeMessage('agent:register')
  async handleAgentRegistration(
    @ConnectedSocket() client: AgentSocket,
    @MessageBody()
    data: {
      id: string;
      name: string;
      type: string;
      capabilities: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<any> {
    this.logger.log(`Agent registration: ${data.id} from socket ${client.id}`);

    try {
      const agent = await this.relayService.registerAgent({
        id: data.id,
        name: data.name,
        type: data.type,
        capabilities: data.capabilities,
        status: 'online',
        metadata: data.metadata,
      });

      // Track socket-agent mapping
      this.connectedAgents.set(client.id, data.id);
      client.agentId = data.id;

      // Join agent-specific room
      client.join(`agent:${data.id}`);
      client.join(`type:${data.type}`);

      // Notify all clients
      this.server.emit('agent:registered', agent);

      return { success: true, agent };
    } catch (error) {
      this.logger.error(`Agent registration failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('agent:unregister')
  async handleAgentUnregistration(
    @ConnectedSocket() client: AgentSocket,
    @MessageBody() data: { id: string }
  ) {
    const result = await this.relayService.unregisterAgent(data.id);
    this.connectedAgents.delete(client.id);

    if (result) {
      this.server.emit('agent:unregistered', { agentId: data.id });
    }

    return { success: result };
  }

  @SubscribeMessage('agent:heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: AgentSocket,
    @MessageBody() data: { agentId: string; status?: string }
  ) {
    // Update last seen
    const agent = await this.relayService.getAgent(data.agentId);
    if (agent) {
      // Just acknowledge - the service tracks lastSeen
      return { success: true, timestamp: new Date().toISOString() };
    }
    return { success: false, error: 'Agent not found' };
  }

  // ========================================
  // Messaging
  // ========================================

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: AgentSocket,
    @MessageBody()
    data: {
      type: string;
      source: string;
      target?: string;
      payload: unknown;
    }
  ) {
    this.logger.debug(`Message from ${data.source} to ${data.target || 'broadcast'}`);

    const messageId = await this.relayService.sendMessage({
      type: data.type,
      source: data.source,
      target: data.target,
      payload: data.payload,
    });

    // Route to target if specified
    if (data.target) {
      this.server.to(`agent:${data.target}`).emit('message:received', {
        id: messageId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Broadcast to all
      this.server.emit('message:broadcast', {
        id: messageId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }

    return { success: true, messageId };
  }

  @SubscribeMessage('message:broadcast')
  async handleBroadcast(
    @ConnectedSocket() client: AgentSocket,
    @MessageBody()
    data: {
      source: string;
      type: string;
      payload: unknown;
      filter?: { type?: string; capability?: string };
    }
  ) {
    const messageIds = await this.relayService.broadcastMessage(
      data.source,
      data.type,
      data.payload,
      data.filter
    );

    // Broadcast to appropriate rooms
    if (data.filter?.type) {
      this.server.to(`type:${data.filter.type}`).emit('message:received', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.server.emit('message:received', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }

    return { success: true, messageIds };
  }

  // ========================================
  // Status & Discovery
  // ========================================

  @SubscribeMessage('status:get')
  async handleStatusRequest(): Promise<any> {
    return {
      status: this.relayService.getStatus(),
      agents: await this.relayService.getAllAgents(),
    };
  }

  @SubscribeMessage('agents:list')
  async handleAgentsList(@MessageBody() filter?: { type?: string; capability?: string }) {
    let agents;

    if (filter?.type) {
      agents = await this.relayService.getAgentsByType(filter.type);
    } else if (filter?.capability) {
      agents = await this.relayService.getAgentsByCapability(filter.capability);
    } else {
      agents = await this.relayService.getAllAgents();
    }

    return { agents };
  }

  // ========================================
  // Event Handlers (from EventEmitter2)
  // ========================================

  @OnEvent('relay.message')
  handleRelayMessage(message: any) {
    // Forward relay messages to WebSocket clients
    if (message.target) {
      this.server.to(`agent:${message.target}`).emit('message:received', message);
    } else {
      this.server.emit('message:broadcast', message);
    }
  }

  @OnEvent('relay.agent.registered')
  handleAgentRegisteredEvent(agent: any) {
    this.server.emit('agent:registered', agent);
  }

  @OnEvent('relay.started')
  handleRelayStarted(data: any) {
    this.server.emit('relay:started', data);
  }

  @OnEvent('relay.stopped')
  handleRelayStopped(data: any) {
    this.server.emit('relay:stopped', data);
  }
}
