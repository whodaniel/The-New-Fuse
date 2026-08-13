import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedSocket } from '../types/index.js';
import { ConnectionPool } from './connection-pool.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConnectionManager {
  private readonly logger = new Logger(ConnectionManager.name);
  private readonly connectionPool: ConnectionPool;
  private heartbeatInterval?: NodeJS.Timeout;
  private readonly heartbeatIntervalMs: number;
  private readonly heartbeatTimeoutMs: number;

  constructor(
    connectionPool: ConnectionPool,
    heartbeatIntervalMs: number = 30000,
    heartbeatTimeoutMs: number = 60000
  ) {
    this.connectionPool = connectionPool;
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.heartbeatTimeoutMs = heartbeatTimeoutMs;
  }

  /**
   * Handle new connection
   */
  public handleConnection(socket: AuthenticatedSocket): void {
    // Add to connection pool
    const added = this.connectionPool.add(socket);

    if (!added) {
      socket.emit('error', { message: 'Connection pool limit reached' });
      socket.disconnect(true);
      return;
    }

    // Setup heartbeat
    this.setupHeartbeat(socket);

    // Setup event handlers
    this.setupEventHandlers(socket);

    this.logger.log(
      `Client connected: ${socket.id}${socket.userId ? ` (User: ${socket.userId})` : ''}`
    );
  }

  /**
   * Handle disconnection
   */
  public handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    this.logger.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
    this.connectionPool.remove(socket.id);
  }

  /**
   * Setup heartbeat for connection
   */
  private setupHeartbeat(socket: AuthenticatedSocket): void {
    let lastPong = Date.now();

    // Send ping periodically
    const pingInterval = setInterval(() => {
      const now = Date.now();

      // Check if client is still responsive
      if (now - lastPong > this.heartbeatTimeoutMs) {
        this.logger.warn(`Heartbeat timeout for client: ${socket.id}`);
        socket.emit('heartbeat:timeout');
        socket.disconnect(true);
        clearInterval(pingInterval);
        return;
      }

      socket.emit('ping', { timestamp: now });
    }, this.heartbeatIntervalMs);

    // Handle pong from client
    socket.on('pong', (data: { timestamp: number }) => {
      lastPong = Date.now();
      const latency = lastPong - data.timestamp;

      // Update connection metadata
      const metadata = this.connectionPool.getMetadata(socket.id);
      if (metadata) {
        metadata.lastActivity = new Date(lastPong);
        metadata.metadata.latency = latency;
      }

      this.logger.debug(`Pong received from ${socket.id} (Latency: ${latency}ms)`);
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      clearInterval(pingInterval);
    });
  }

  /**
   * Setup event handlers for socket
   */
  private setupEventHandlers(socket: AuthenticatedSocket): void {
    // Handle errors
    socket.on('error', (error: Error) => {
      this.logger.error(`Socket error for ${socket.id}: ${error.message}`, error.stack);
    });

    // Handle room join
    socket.on('join:room', (roomName: string) => {
      socket.join(roomName);
      const metadata = this.connectionPool.getMetadata(socket.id);
      if (metadata) {
        metadata.rooms.add(roomName);
      }
      this.logger.debug(`Socket ${socket.id} joined room: ${roomName}`);
    });

    // Handle room leave
    socket.on('leave:room', (roomName: string) => {
      socket.leave(roomName);
      const metadata = this.connectionPool.getMetadata(socket.id);
      if (metadata) {
        metadata.rooms.delete(roomName);
      }
      this.logger.debug(`Socket ${socket.id} left room: ${roomName}`);
    });

    // Update activity on any event
    socket.onAny(() => {
      this.connectionPool.updateActivity(socket.id);
    });
  }

  /**
   * Broadcast message to all connections
   */
  public broadcast(event: string, data: any): void {
    const connections = this.connectionPool.getAllConnections();
    connections.forEach((socket) => {
      socket.emit(event, data);
    });
    this.logger.debug(`Broadcast ${event} to ${connections.length} connections`);
  }

  /**
   * Send message to specific user (all their connections)
   */
  public sendToUser(userId: string, event: string, data: any): void {
    const connections = this.connectionPool.getUserConnections(userId);
    connections.forEach((socket) => {
      socket.emit(event, data);
    });
    this.logger.debug(`Sent ${event} to user ${userId} (${connections.length} connections)`);
  }

  /**
   * Send message to room
   */
  public sendToRoom(roomName: string, event: string, data: any): void {
    const connections = this.connectionPool.getAllConnections();
    let sentCount = 0;

    connections.forEach((socket) => {
      if (socket.rooms.has(roomName)) {
        socket.emit(event, data);
        sentCount++;
      }
    });

    this.logger.debug(`Sent ${event} to room ${roomName} (${sentCount} connections)`);
  }

  /**
   * Disconnect a specific socket
   */
  public disconnect(socketId: string, reason?: string): void {
    const socket = this.connectionPool.get(socketId);
    if (socket) {
      if (reason) {
        socket.emit('disconnect:reason', { reason });
      }
      socket.disconnect(true);
      this.connectionPool.remove(socketId);
    }
  }

  /**
   * Disconnect all connections for a user
   */
  public disconnectUser(userId: string, reason?: string): void {
    const connections = this.connectionPool.getUserConnections(userId);
    connections.forEach((socket) => {
      if (reason) {
        socket.emit('disconnect:reason', { reason });
      }
      socket.disconnect(true);
      this.connectionPool.remove(socket.id);
    });
    this.logger.log(`Disconnected ${connections.length} connections for user ${userId}`);
  }

  /**
   * Get connection pool statistics
   */
  public getStats() {
    return this.connectionPool.getStats();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.connectionPool.destroy();
  }
}
