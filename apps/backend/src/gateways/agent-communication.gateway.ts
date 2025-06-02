import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../services/redis.service.js';
import { Redis } from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AgentCommunicationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AgentCommunicationGateway');
  private subscriber: Redis;

  constructor(private readonly redisService: RedisService) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.subscriber = new Redis(redisUrl);
  }

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
    this.setupRedisSubscriptions();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private async setupRedisSubscriptions() {
    try {
      // Subscribe to Trae and Augment channels
      await this.subscriber.subscribe('agent:trae', 'agent:augment', 'agent:broadcast');
      
      this.subscriber.on('message', (channel: string, message: string) => {
        try {
          const data = JSON.parse(message);
          
          // Emit the message to WebSocket clients
          this.server.emit(channel, {
            type: channel,
            payload: data
          });
          
          this.logger.debug(`Forwarded message from ${channel} to WebSocket clients`);
        } catch (error) {
          this.logger.error(`Error processing Redis message: ${error.message}`);
        }
      });
      
      this.logger.log('Redis subscriptions established');
    } catch (error) {
      this.logger.error(`Failed to setup Redis subscriptions: ${error.message}`);
    }
  }
}