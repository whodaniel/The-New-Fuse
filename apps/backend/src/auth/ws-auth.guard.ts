import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LoggingService } from '../services/logging.service.js';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private logger: LoggingService
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHeader(client);
    
    if (!token) {
      this.logger.warn('WebSocket connection attempt without token');
      throw new WsException('Unauthorized');
    }
    
    try {
      const payload = this.jwtService.verify(token);
      // Attach user to socket
      client['user'] = payload;
      return true;
    } catch (error) {
      this.logger.error('WebSocket authentication failed', { error: error.message });
      throw new WsException('Unauthorized');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const auth = client.handshake?.auth?.token;
    return auth ? auth.replace('Bearer ', '') : undefined;
  }
}
