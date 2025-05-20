import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class WebSocketService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  
  private readonly logger = new Logger(WebSocketService.name);
  private connectedClients = new Map<string, Socket>();

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token;
      const { valid, user } = await this.authService.validateToken(token);
      
      if (!valid || !user) {
        throw new Error('Invalid authentication');
      }

      this.connectedClients.set(user.id, client);
      this.logger.log(`Client connected: ${user.id}`);
      this.broadcastUserStatus(user.id, 'online');
      
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.findUserIdBySocket(client);
    if (userId) {
      this.connectedClients.delete(userId);
      this.broadcastUserStatus(userId, 'offline');
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  async broadcastMessage(message: WebSocketMessage): Promise<void> {
    this.server.emit('message', {
      ...message,
      timestamp: Date.now()
    });
  }

  async sendToUser(userId: string, message: WebSocketMessage): Promise<void> {
    this.server.to(`user:${userId}`).emit('message', {
      ...message,
      timestamp: Date.now()
    });
  }

  private findUserIdBySocket(client: Socket): string | undefined {
    for (const [userId, socket] of this.connectedClients.entries()) {
      if (socket.id === client.id) {
        return userId;
      }
    }
    return undefined;
  }

  private broadcastUserStatus(userId: string, status: online' | 'offline'): void {
    this.server.emit('userStatus', {
      userId,
      status,
      timestamp: Date.now(),
    });
  }
}
