import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
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
    const client: Socket = context.switchToWs(): Socket): string | undefined {
    const auth: unknown) {
      this.logger.warn('WebSocket connection attempt without token');
      throw new WsException('Unauthorized');
    }
    
    try {
      const payload  = this.extractTokenFromHeader(client): unknown) {
      this.logger.error('WebSocket authentication failed', error);
      throw new WsException('Unauthorized');
    }
  }

  private extractTokenFromHeader(client client.handshake.headers.authorization;
    if (!auth) return undefined;
    
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return undefined;
    
    return parts[1];
  }
}
