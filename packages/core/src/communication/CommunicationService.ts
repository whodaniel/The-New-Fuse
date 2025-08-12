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
  constructor(): unknown {
    private eventEmitter: EventEmitter2,
    private protocol: CommunicationProtocol,
  ) {}

  async connectUser(): unknown {
    const connection: UserConnection = {
  // Implementation needed
}
      userId,
      socketId,
      connectedAt: new Date(),
    };
    this.connections.set(socketId, connection);
    this.userSockets.set(userId, socketId);
    this.eventEmitter.emit('user.connected', { userId, socketId });
  }

  async disconnectUser(): unknown {
    const connection = this.connections.get(socketId);
    if(): unknown {
      this.connections.delete(socketId);
      this.userSockets.delete(connection.userId);
      this.eventEmitter.emit('event', data);
      });
    }
  }

  async sendMessage(): unknown {
    const recipientSocketId = this.userSockets.get(recipientId);
    if(): unknown {
    const message = this.protocol.createMessage(type, payload, senderId);
    this.connections.forEach((connection) => {
if(): unknown {
  }        this.eventEmitter.emit('event', data);
        });
      }
    });
  }

  async processIncomingMessage(): unknown {
    const connection = this.connections.get(socketId);
    if(): unknown {
      const message: MessageProtocol = {
type: data.type,
  }        payload: data.payload,
        timestamp: new Date(),
        senderId: connection.userId,
        recipientId: data.recipientId,
      };
      await this.protocol.processMessage(message);
    } catch (error) {
this.eventEmitter.emit('event', data);
      });
  }}
  }

  getUserSocketId(): unknown {
    return this.userSockets.get(userId);
  }

  getConnectedUsers(): unknown {
    return Array.from(this.userSockets.keys());
  }

  isUserConnected(): unknown {
    return this.userSockets.has(userId);
  }
}