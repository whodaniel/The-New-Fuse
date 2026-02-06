import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommunicationProtocol, MessageProtocol } from './CommunicationProtocol';

export interface UserConnection {
  userId: string;
  socketId: string;
  connectedAt: Date;
}

@Injectable()
export class CommunicationService {
  private connections: Map<string, UserConnection> = new Map();
  private userSockets: Map<string, string> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private protocol: CommunicationProtocol,
  ) {}

  async connectUser(userId: string, socketId: string): Promise<void> {
    const connection: UserConnection = {
      userId,
      socketId,
      connectedAt: new Date(),
    };

    this.connections.set(socketId, connection);
    this.userSockets.set(userId, socketId);
    this.eventEmitter.emit('user.connected', { userId, socketId });
  }

  async disconnectUser(socketId: string): Promise<void> {
    const connection = this.connections.get(socketId);
    if (connection) {
      this.connections.delete(socketId);
      this.userSockets.delete(connection.userId);
      this.eventEmitter.emit('user.disconnected', { userId: connection.userId, socketId });
    }
  }

  async sendMessage(
    senderId: string,
    recipientId: string,
    type: string,
    payload: any,
  ): Promise<void> {
    const recipientSocketId = this.userSockets.get(recipientId);
    if (recipientSocketId) {
      const message = this.protocol.createMessage(type, payload, senderId, recipientId);
      this.eventEmitter.emit('message.send', { socketId: recipientSocketId, message });
    }
  }

  async broadcastMessage(senderId: string, type: string, payload: any): Promise<void> {
    const message = this.protocol.createMessage(type, payload, senderId);
    this.connections.forEach((connection) => {
      if (connection.userId !== senderId) {
        this.eventEmitter.emit('message.send', { socketId: connection.socketId, message });
      }
    });
  }

  async processIncomingMessage(socketId: string, data: any): Promise<void> {
    try {
      const connection = this.connections.get(socketId);
      if (connection) {
        const message: MessageProtocol = {
          type: data.type,
          payload: data.payload,
          timestamp: new Date(),
          senderId: connection.userId,
          recipientId: data.recipientId,
        };
        await this.protocol.processMessage(message);
      }
    } catch (error) {
      this.eventEmitter.emit('message.error', { socketId, error });
    }
  }

  getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
