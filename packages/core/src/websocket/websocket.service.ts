import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface WebSocketConnection {
  id: string;
  clientId: string;
  status: 'connected' | 'disconnected';
  connectedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  clientId: string;
  direction: 'inbound' | 'outbound';
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private connections: Map<string, WebSocketConnection> = new Map();
  private messages: Map<string, WebSocketMessage> = new Map();

  constructor(private eventEmitter: EventEmitter2) {}

  async handleConnection(clientId: string, metadata?: Record<string, any>): Promise<WebSocketConnection> {
    const connection: WebSocketConnection = {
      id: this.generateId(),
      clientId,
      status: 'connected',
      connectedAt: new Date(),
      lastActivity: new Date(),
      metadata
    };

    this.connections.set(clientId, connection);
    this.eventEmitter.emit('websocket.connected', connection);
    
    this.logger.log(`Client connected: ${clientId}`);
    return connection;
  }

  async handleDisconnection(clientId: string): Promise<void> {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.status = 'disconnected';
      this.connections.set(clientId, connection);
      this.eventEmitter.emit('websocket.disconnected', connection);
      
      this.logger.log(`Client disconnected: ${clientId}`);
    }
  }

  async sendMessage(clientId: string, type: string, data: any): Promise<WebSocketMessage> {
    const message: WebSocketMessage = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date(),
      clientId,
      direction: 'outbound'
    };

    this.messages.set(message.id, message);
    this.updateLastActivity(clientId);
    this.eventEmitter.emit('websocket.message.sent', message);
    
    this.logger.log(`Message sent to ${clientId}: ${type}`);
    return message;
  }

  async handleMessage(clientId: string, type: string, data: any): Promise<WebSocketMessage> {
    const message: WebSocketMessage = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date(),
      clientId,
      direction: 'inbound'
    };

    this.messages.set(message.id, message);
    this.updateLastActivity(clientId);
    this.eventEmitter.emit('websocket.message.received', message);
    
    this.logger.log(`Message received from ${clientId}: ${type}`);
    return message;
  }

  async broadcastMessage(type: string, data: any, excludeClient?: string): Promise<WebSocketMessage[]> {
    const messages: WebSocketMessage[] = [];
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected' && conn.clientId !== excludeClient);

    for (const connection of activeConnections) {
      const message = await this.sendMessage(connection.clientId, type, data);
      messages.push(message);
    }

    this.eventEmitter.emit('websocket.broadcast', { type, data, count: messages.length });
    return messages;
  }

  async getConnection(clientId: string): Promise<WebSocketConnection | null> {
    return this.connections.get(clientId) || null;
  }

  async getAllConnections(): Promise<WebSocketConnection[]> {
    return Array.from(this.connections.values());
  }

  async getActiveConnections(): Promise<WebSocketConnection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected');
  }

  async getMessages(clientId?: string, limit?: number): Promise<WebSocketMessage[]> {
    let messages = Array.from(this.messages.values());
    
    if (clientId) {
      messages = messages.filter(msg => msg.clientId === clientId);
    }
    
    messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (limit) {
      messages = messages.slice(0, limit);
    }
    
    return messages;
  }

  async getConnectionStats(): Promise<any> {
    const connections = Array.from(this.connections.values());
    const activeConnections = connections.filter(conn => conn.status === 'connected');
    
    return {
      total: connections.length,
      active: activeConnections.length,
      disconnected: connections.length - activeConnections.length,
      messagesCount: this.messages.size
    };
  }

  private updateLastActivity(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.lastActivity = new Date();
      this.connections.set(clientId, connection);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}