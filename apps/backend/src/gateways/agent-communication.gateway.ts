import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../services/redis.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AgentCommunicationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AgentCommunicationGateway');
  private subscriber: Redis;

  constructor(private readonly redisService: RedisService) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.subscriber = new (Redis as any)(redisUrl);
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
          this.server.emit('agent:broadcast', { type: channel, payload: data });

          this.logger.debug(`Forwarded message from ${channel} to WebSocket clients`);
        } catch (error) {
          this.logger.error(`Error processing Redis message: ${(error as Error).message}`);
        }
      });

      this.logger.log('Redis subscriptions established');
    } catch (error) {
      this.logger.error(`Failed to setup Redis subscriptions: ${(error as Error).message}`);
    }
  }
}
