import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@the-new-fuse/utils';
import { WebSocketError } from '@the-new-fuse/types';

@Injectable()
export class WebSocketService implements OnModuleInit {
  private readonly logger: Logger;
  private io: Server;

  constructor() {
    this.logger = new Logger(WebSocketService.name);
    this.io = new Server({
      cors: {
        origin: (process as any).env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });
  }

  onModuleInit() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info('Client connected', { socketId: socket.id });

      socket.on('error', (error: Error) => {
        this.handleError(socket, error);
      });

      socket.on('message', (data: unknown) => {
        this.handleMessage(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleMessage(socket: Socket, data: unknown): void {
    try {
      this.logger.debug('Received message', { socketId: socket.id, data });
      // Process message
      socket.emit('messageReceived', { success: true });
    } catch (error) {
      this.handleError(socket, error as Error);
    }
  }

  private handleError(socket: Socket, error: Error | WebSocketError): void {
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

  public broadcast(event: string, data: unknown): void {
    try {
      this.io.emit(event, data);
    } catch (error) {
      this.logger.error('Failed to emit event', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public getServer(): Server {
    return this.io;
  }
}
