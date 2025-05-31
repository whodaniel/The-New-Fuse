import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from './redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
@Injectable()
export class AgentBridgeService {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgentBridgeService.name);

  constructor(private readonly redisService: RedisService) {
    this.setupRedisSubscriptions();
  }

  private async setupRedisSubscriptions() {
    // Listen for Redis messages and bridge them to WebSocket
    this.redisService.subClient.on('message', (channel: string, message: string) => {
      this.handleRedisMessage(channel, message);
    });
  }

  private async handleRedisMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);
      // Emit to appropriate WebSocket room based on channel
      this.server.to(channel).emit('agent_message', {
        channel,
        message: data
      });
    } catch (error) {
      this.logger.error(`Error handling Redis message: ${error}`);
    }
  }

  @SubscribeMessage('join_agent_channel')
  handleJoinChannel(client: Socket, channel: string) {
    client.join(channel);
    this.logger.log(`Client ${client.id} joined channel ${channel}`);
  }

  @SubscribeMessage('leave_agent_channel')
  handleLeaveChannel(client: Socket, channel: string) {
    client.leave(channel);
    this.logger.log(`Client ${client.id} left channel ${channel}`);
  }

  @SubscribeMessage('agent_message')
  async handleAgentMessage(client: Socket, payload: any) {
    const { channel, message } = payload;
    
    // Forward message to Redis
    if (channel === 'agent:composer') {
      await this.redisService.sendToComposer(message);
    } else if (channel === 'agent:roo-coder') {
      await this.redisService.sendToRooCoder(message);
    }
  }
} 
