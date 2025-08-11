import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
@WebSocketGateway({ cors: true })
export class WebSocketService {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketService.name);

  sendToAll(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcasted event: ${event}`);
  }

  sendToUser(userId: string, event: string, data: any): void {
    this.server.to(userId).emit(event, data);
    this.logger.debug(`Sent event to user ${userId}: ${event}`);
  }

  handleConnection(client: any): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}