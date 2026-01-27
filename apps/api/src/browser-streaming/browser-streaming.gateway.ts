/**
 * Browser Streaming WebSocket Gateway
 *
 * Streams browser frames to connected clients via WebSocket
 */

import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { StreamFrame } from './browser-streaming.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this in production
    credentials: true,
  },
  namespace: '/browser-streaming',
})
export class BrowserStreamingGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BrowserStreamingGateway.name);
  private subscribedClients = new Map<string, Set<string>>(); // sessionId -> Set<socketId>

  /**
   * Handle new client connections
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to browser streaming' });
  }

  /**
   * Handle client disconnections
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up subscriptions
    for (const [sessionId, clients] of this.subscribedClients.entries()) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.subscribedClients.delete(sessionId);
      }
    }
  }

  /**
   * Subscribe to a specific session's stream
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
    const { sessionId } = data;

    if (!this.subscribedClients.has(sessionId)) {
      this.subscribedClients.set(sessionId, new Set());
    }

    this.subscribedClients.get(sessionId)!.add(client.id);

    this.logger.log(`Client ${client.id} subscribed to session ${sessionId}`);

    return {
      success: true,
      message: `Subscribed to session ${sessionId}`,
    };
  }

  /**
   * Unsubscribe from a session's stream
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
    const { sessionId } = data;

    const clients = this.subscribedClients.get(sessionId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.subscribedClients.delete(sessionId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from session ${sessionId}`);

    return {
      success: true,
      message: `Unsubscribed from session ${sessionId}`,
    };
  }

  /**
   * Listen for frame events from the service and broadcast to subscribers
   */
  @OnEvent('browser.frame')
  handleFrame(frame: StreamFrame) {
    const { sessionId } = frame;
    const subscribers = this.subscribedClients.get(sessionId);

    if (!subscribers || subscribers.size === 0) {
      return; // No subscribers, skip
    }

    // Broadcast to all subscribers of this session
    for (const clientId of subscribers) {
      this.server.to(clientId).emit('frame', {
        sessionId: frame.sessionId,
        frame: frame.frame,
        timestamp: frame.timestamp,
        width: frame.width,
        height: frame.height,
      });
    }
  }

  /**
   * Broadcast a status update to all connected clients
   */
  broadcastStatus(status: any) {
    this.server.emit('status', status);
  }
}
