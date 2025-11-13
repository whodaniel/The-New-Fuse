var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebSocketService_1;
var _a, _b;
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from '../auth/auth.service';
let WebSocketService = WebSocketService_1 = class WebSocketService {
    authService;
    server;
    logger = new Logger(WebSocketService_1.name);
    connectedClients = new Map();
    constructor(authService) {
        this.authService = authService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token;
            const { valid, user } = await this.authService.validateToken(token);
            if (!valid || !user) {
                throw new Error('Invalid authentication');
            }
            this.connectedClients.set(user.id, client);
            this.logger.log(`Client connected: ${user.id});
      this.broadcastUserStatus(user.id, 'online');
      
    } catch (error) {`, this.logger.error(`Connection error: ${error.message}`));
            client.disconnect();
        }
        finally {
        }
    }
    async handleDisconnect(client) {
        const userId = this.findUserIdBySocket(client);
        if (userId) {
            this.connectedClients.delete(userId);
            this.broadcastUserStatus(userId, 'offline');
            this.logger.log(Client, disconnected, $, { userId });
        }
    }
    async broadcastMessage(message) {
        this.server.emit('message', {
            ...message,
            timestamp: Date.now()
        });
    }
    async sendToUser(userId, message) {
        `
    this.server.to(user:${userId}` `).emit('message', {
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

  private broadcastUserStatus(userId: string, status: 'online' | 'offline'): void {
    this.server.emit('userStatus', {
      userId,
      status,
      timestamp: Date.now(),
    });
  }
}
        ;
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", typeof (_b = typeof Server !== "undefined" && Server) === "function" ? _b : Object)
], WebSocketService.prototype, "server", void 0);
WebSocketService = WebSocketService_1 = __decorate([
    Injectable(),
    WebSocketGateway({
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof AuthService !== "undefined" && AuthService) === "function" ? _a : Object])
], WebSocketService);
export { WebSocketService };
//# sourceMappingURL=WebSocketService.js.map