/**
 * Browser Streaming WebSocket Gateway
 */

import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            'https://thenewfuse.com',
            'https://www.thenewfuse.com',
            'https://api-production-48f1.up.railway.app',
          ]
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
  },
})
export class BrowserStreamingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BrowserStreamingGateway.name);
  private subscriptions = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to browser streaming' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up subscriptions
    this.subscriptions.forEach((clients) => clients.delete(client.id));
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: { sessionId: string }) {
    if (!this.subscriptions.has(data.sessionId)) {
      this.subscriptions.set(data.sessionId, new Set());
    }
    this.subscriptions.get(data.sessionId)!.add(client.id);
    this.logger.log(`Client ${client.id} subscribed to ${data.sessionId}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: { sessionId: string }) {
    const subscribers = this.subscriptions.get(data.sessionId);
    if (subscribers) {
      subscribers.delete(client.id);
    }
    this.logger.log(`Client ${client.id} unsubscribed from ${data.sessionId}`);
  }

  @OnEvent('browser.frame')
  handleBrowserFrame(frame: any) {
    const subscribers = this.subscriptions.get(frame.sessionId);
    if (subscribers) {
      subscribers.forEach((clientId) => {
        this.server.to(clientId).emit('frame', frame);
      });
    }
  }
}
