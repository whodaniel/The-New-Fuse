import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { A2AMessage, AgentStatus, ConnectionMetadata } from '../protocols/types.js';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { AgentAuthService } from './AgentAuthService.js';
import { MetricsService } from '../metrics/metrics.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  namespace: '/agents'
})
@Injectable()
export class AgentWebSocketService {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AgentWebSocketService.name);
    private agentSockets = new Map<string, Socket>();
    private agentHeartbeats = new Map<string, number>();
    private readonly heartbeatInterval = 30000; // 30 seconds

    constructor(
        private readonly mcpBroker: MCPBrokerService,
        private readonly authService: AgentAuthService,
        private readonly metrics: MetricsService
    ) {
        this.setupHeartbeatCheck();
    }

    private setupHeartbeatCheck() {
        setInterval(() => {
            const now = Date.now();
            this.agentSockets.forEach((socket, agentId) => {
                const lastHeartbeat = this.agentHeartbeats.get(agentId);
                if (lastHeartbeat && now - lastHeartbeat > this.heartbeatInterval * 2) {
                    this.logger.warn(`Agent ${agentId} heartbeat timeout, disconnecting`);
                    this.handleDisconnect(socket);
                }
            });
        }, this.heartbeatInterval);
    }

    async handleConnection(@ConnectedSocket() client: Socket) {
        try {
            const metadata = this.validateConnectionMetadata(client);
            const isAuthorized = await this.authService.validateAgent(metadata);

            if (!isAuthorized) {
                this.logger.warn(`Unauthorized connection attempt from agent ${metadata.agentId}`);
                client.disconnect(true);
                return;
            }

            this.agentSockets.set(metadata.agentId, client);
            this.agentHeartbeats.set(metadata.agentId, Date.now());
            
            await this.mcpBroker.executeDirective('agent', 'agentConnected', {
                agentId: metadata.agentId,
                capabilities: metadata.capabilities || []
            });

            this.broadcastAgentStatus(metadata.agentId, 'connected');
            this.metrics.recordAgentConnection(metadata.agentId);

            this.logger.log(`Agent ${metadata.agentId} connected successfully`);
        } catch (error) {
            this.logger.error(`Error handling connection:`, error);
            client.disconnect(true);
        }
    }

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        try {
            const metadata = this.validateConnectionMetadata(client);
            this.agentSockets.delete(metadata.agentId);
            this.agentHeartbeats.delete(metadata.agentId);

            await this.mcpBroker.executeDirective('agent', 'agentDisconnected', {
                agentId: metadata.agentId
            });

            this.broadcastAgentStatus(metadata.agentId, 'disconnected');
            this.metrics.recordAgentDisconnection(metadata.agentId);

            this.logger.log(`Agent ${metadata.agentId} disconnected`);
        } catch (error) {
            this.logger.error(`Error handling disconnect:`, error);
        }
    }

    @SubscribeMessage('agent_message')
    async handleMessage(
        @ConnectedSocket() client: Socket, 
        message: A2AMessage
    ) {
        try {
            const metadata = this.validateConnectionMetadata(client);
            
            // Validate message sender matches connected agent
            if (message.metadata.sender !== metadata.agentId) {
                throw new Error('Message sender does not match connected agent');
            }

            const targetAgent = this.agentSockets.get(message.metadata.target);
            if (targetAgent) {
                await this.metrics.recordMessageDelivery(message);
                targetAgent.emit('agent_message', message);
                this.logger.debug(`Message delivered from ${message.metadata.sender} to ${message.metadata.target}`);
            } else {
                // Queue message for offline agent
                await this.mcpBroker.executeDirective('message', 'queueMessage', {
                    message,
                    target: message.metadata.target
                });
                this.logger.debug(`Message queued for offline agent ${message.metadata.target}`);
            }
        } catch (error) {
            this.logger.error(`Error handling message:`, error);
            client.emit('error', {
                error: 'Failed to process message',
                details: error.message
            });
        }
    }

    @SubscribeMessage('heartbeat')
    handleHeartbeat(@ConnectedSocket() client: Socket) {
        try {
            const metadata = this.validateConnectionMetadata(client);
            this.agentHeartbeats.set(metadata.agentId, Date.now());
        } catch (error) {
            this.logger.error(`Error handling heartbeat:`, error);
        }
    }

    broadcastAgentStatus(agentId: string, status: AgentStatus) {
        try {
            this.server.emit('agent_status', { 
                agentId, 
                status,
                timestamp: Date.now()
            });
            this.metrics.recordStatusChange(agentId, status);
        } catch (error) {
            this.logger.error(`Error broadcasting status:`, error);
        }
    }

    private validateConnectionMetadata(client: Socket): ConnectionMetadata {
        const agentId = client.handshake.query.agentId;
        if (!agentId || typeof agentId !== 'string') {
            throw new Error('Invalid agent ID in connection metadata');
        }

        const capabilities = client.handshake.query.capabilities;
        return {
            agentId,
            capabilities: capabilities ? JSON.parse(capabilities as string) : []
        };
    }

    async getConnectedAgents(): Promise<string[]> {
        return Array.from(this.agentSockets.keys());
    }

    async getAgentStatus(agentId: string): Promise<AgentStatus> {
        return this.agentSockets.has(agentId) ? 'connected' : 'disconnected';
    }
}