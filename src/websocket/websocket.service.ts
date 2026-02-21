import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@the-new-fuse/utils';
import { WebSocketError } from './websocket.error.js';

@Injectable()
export class WebSocketService {
  private readonly logger: Logger;
  private io: Server;

  constructor() {
    this.logger = new Logger('WebSocketService');
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info('Client connected', { socketId: socket.id });

      socket.on('error', (error: Error) => {
        this.handleError(socket, error);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  public handleError(socket: Socket, error: Error | WebSocketError): void {
    const errorMessage = error instanceof WebSocketError 
      ? error.message 
      : 'Internal WebSocket error';

    this.logger.error('WebSocket error:', {
      socketId: socket.id,
      error: errorMessage,
      stack: error.stack
    });

    socket.emit('error', {
      message: errorMessage,
      code: error instanceof WebSocketError ? error.code : 500
    });
  }

  private handleDisconnect(socket: Socket): void {
    this.logger.info('Client disconnected', { socketId: socket.id });
  }

  public emitEvent(event: string, data: unknown): void {
    try {
      this.io.emit(event, data);
    } catch (error) {
      this.logger.error('Failed to emit event', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}