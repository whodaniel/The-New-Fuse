import { Inject, Logger, Optional, UnauthorizedException, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
// @ts-ignore
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../auth/ws-auth.guard'; // Changed from @/auth/ws-auth.guard
import { CacheService } from '../cache/cache.service'; // Changed from @/cache/cache.service
import { UnifiedMonitoringService } from '../types/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private cache: CacheService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Optional()
    @Inject('UnifiedMonitoringService')
    private monitoring?: UnifiedMonitoringService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        this.logger.warn(`WebSocket connection rejected - no token provided for client ${client.id}`);
        client.disconnect();
        return;
      }

      // Validate JWT token before caching
      let userId: string;
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        userId = payload.sub || payload.userId || payload.id;
        
        if (!userId) {
          throw new Error('No user ID in token payload');
        }
      } catch (error) {
        this.logger.warn(`WebSocket connection rejected - invalid token for client ${client.id}`);
        client.disconnect();
        return;
      }

      await this.cache.set(`socket:${client.id}`, userId);
      await this.cache.sadd(`online_users`, userId);

      this.monitoring?.recordMetric('websocket.connection', 1, { userId });

      this.server.emit('users:online', {
        count: await this.cache.scard('online_users'),
      });
    } catch (error) {
      this.monitoring?.captureError(error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.cache.get(`socket:${client.id}`);
    await this.cache.del(`socket:${client.id}`);
    if (userId) {
      await this.cache.srem('online_users', userId);
    }

    this.monitoring?.recordMetric('websocket.disconnect', 1, { userId });

    this.server.emit('users:online', {
      count: await this.cache.scard('online_users'),
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

      this.monitoring?.recordMetric('websocket.message', 1, {
        userId,
        agentId: payload.agentId,
      });
    } catch (error) {
      this.monitoring?.captureError(error);
      client.emit('error', { message: 'Failed to process message' });
    }
  }
}
