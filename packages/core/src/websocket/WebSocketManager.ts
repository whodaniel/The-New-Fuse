import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

export interface WebSocketClient {
  id: string;
  socket: Socket;
  connectedAt: Date;
  lastActivity: Date;
  metadata: Record<string, any>;
}

export interface BroadcastMessage {
  type: string;
  data: any;
  target?: string;
  timestamp: Date;
}

@Injectable()
export class WebSocketManager extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketManager.name);
  private server!: Server;
  private readonly clients = new Map<string, WebSocketClient>();

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    const port = this.configService.get<number>('WS_PORT', 8080);
    this.server = new Server(port, {
      cors: {
        origin: this.configService.get('CORS_ORIGINS', '*'),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.server.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    this.logger.log(`WebSocket server started on port ${port}`);
  }

  async onModuleDestroy() {
    if (this.server) {
      this.server.close(() => {
        this.logger.log('WebSocket server closed');
      });
    }
  }

  private handleConnection(socket: Socket) {
    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      id: clientId,
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
      metadata: {},
    };

    this.clients.set(clientId, client);
    this.logger.log(`Client connected: ${clientId}`);

    socket.on('disconnect', (reason) => {
      this.handleDisconnection(clientId, reason);
    });

    socket.on('error', (error) => {
      this.logger.error(`Socket error for client ${clientId}:`, error);
      this.handleError(clientId, error);
    });

    socket.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    socket.on('ping', () => {
      this.handlePing(clientId);
    });

    socket.on('join-room', (room: string) => {
      this.handleJoinRoom(clientId, room);
    });

    socket.on('leave-room', (room: string) => {
      this.handleLeaveRoom(clientId, room);
    });

    // Send welcome message
    socket.emit('connected', {
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to WebSocket server',
    });

    this.emit('clientConnected', client);
  }

  private handleDisconnection(clientId: string, reason: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}, reason: ${reason}`);
      this.emit('clientDisconnected', { client, reason });
    }
  }

  private handleError(clientId: string, error: Error) {
    const client = this.clients.get(clientId);
    if (client) {
      this.logger.error(`Client error: ${clientId}`, error);
      this.emit('clientError', { client, error });
    }
  }

  private handleMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
      this.logger.debug(`Message from ${clientId}:`, data);
      this.emit('clientMessage', { client, data });
    }
  }

  private handlePing(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
      client.socket.emit('pong', { timestamp: new Date().toISOString() });
    }
  }

  private handleJoinRoom(clientId: string, room: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.join(room);
      this.logger.log(`Client ${clientId} joined room: ${room}`);
      this.emit('clientJoinedRoom', { client, room });
    }
  }

  private handleLeaveRoom(clientId: string, room: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.leave(room);
      this.logger.log(`Client ${clientId} left room: ${room}`);
      this.emit('clientLeftRoom', { client, room });
    }
  }

  // Public methods
  broadcast(message: BroadcastMessage): void {
    this.server.emit(message.type, {
      ...message.data,
      timestamp: message.timestamp,
    });
    this.logger.debug('Broadcasted message:', message);
  }

  broadcastToRoom(room: string, message: BroadcastMessage): void {
    this.server.to(room).emit(message.type, {
      ...message.data,
      timestamp: message.timestamp,
    });
    this.logger.debug(`Broadcasted to room ${room}:`, message);
  }

  sendToClient(clientId: string, type: string, data: any): boolean {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.emit(type, {
        ...data,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return false;
  }

  disconnectClient(clientId: string, _reason?: string): boolean {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.disconnect(true);
      return true;
    }
    return false;
  }

  getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  getAllClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  getClientsInRoom(room: string): WebSocketClient[] {
    return Array.from(this.clients.values()).filter((client) => client.socket.rooms.has(room));
  }

  isClientConnected(clientId: string): boolean {
    return this.clients.has(clientId);
  }

  updateClientMetadata(clientId: string, metadata: Record<string, any>): boolean {
    const client = this.clients.get(clientId);
    if (client) {
      client.metadata = { ...client.metadata, ...metadata };
      return true;
    }
    return false;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check methods
  async healthCheck(): Promise<{
    status: string;
    connectedClients: number;
    uptime: number;
  }> {
    return {
      status: 'healthy',
      connectedClients: this.clients.size,
      uptime: process.uptime(),
    };
  }

  // Cleanup inactive clients
  cleanupInactiveClients(timeoutMs: number = 300000): number {
    // 5 minutes default
    const now = new Date();
    let cleaned = 0;

    for (const [clientId, client] of this.clients) {
      const inactiveTime = now.getTime() - client.lastActivity.getTime();
      if (inactiveTime > timeoutMs) {
        this.disconnectClient(clientId, 'Inactive timeout');
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} inactive clients`);
    }

    return cleaned;
  }
}
