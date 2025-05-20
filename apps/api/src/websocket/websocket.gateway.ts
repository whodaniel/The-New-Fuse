import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/ws-auth.guard.js'; // Changed from @/auth/ws-auth.guard
import { CacheService } from '../cache/cache.service.js'; // Changed from @/cache/cache.service
import { UnifiedMonitoringService } from '@the-new-fuse/core';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private cache: CacheService,
    private monitoring: UnifiedMonitoringService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.token;
      await this.cache.set(`socket:${client.id}`, userId);
      await this.cache.sadd(`online_users`, userId);
      
      this.monitoring.recordMetric('websocket.connection', 1, { userId });
      
      this.server.emit('users:online', {
        count: await this.cache.scard('online_users')
      });
    } catch (error) {
      this.monitoring.captureError(error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.cache.get(`socket:${client.id}`);
    await this.cache.del(`socket:${client.id}`);
    await this.cache.srem('online_users', userId);
    
    this.monitoring.recordMetric('websocket.disconnect', 1, { userId });
    
    this.server.emit('users:online', {
      count: await this.cache.scard('online_users')
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('agent:message')
  async handleMessage(client: Socket, payload: any) {
    try {
      const userId = await this.cache.get(`socket:${client.id}`);
      
      // Process and broadcast message
      this.server.to(payload.roomId).emit('agent:message', {
        ...payload,
        timestamp: new Date(),
      });
      
      this.monitoring.recordMetric('websocket.message', 1, {
        userId,
        agentId: payload.agentId
      });
    } catch (error) {
      this.monitoring.captureError(error);
      client.emit('error', { message: 'Failed to process message' });
    }
  }
}