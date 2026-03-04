import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedSocket, ConnectionMetadata, ConnectionPoolStats } from '../types';
import { EventEmitter } from 'events';

@Injectable()
export class ConnectionPool extends EventEmitter {
  private readonly logger = new Logger(ConnectionPool.name);
  private connections: Map<string, AuthenticatedSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private metadata: Map<string, ConnectionMetadata> = new Map();
  private readonly maxConnections: number;
  private readonly idleTimeout: number;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(maxConnections: number = 10000, idleTimeout: number = 300000) {
    super();
    this.maxConnections = maxConnections;
    this.idleTimeout = idleTimeout;
    this.startCleanupTask();
  }

  /**
   * Add a connection to the pool
   */
  public add(socket: AuthenticatedSocket): boolean {
    if (this.connections.size >= this.maxConnections) {
      this.logger.warn(`Connection pool limit reached: ${this.maxConnections}`);
      this.emit('pool:limit-reached', { current: this.connections.size });
      return false;
    }

    this.connections.set(socket.id, socket);

    // Track user connections
    if (socket.userId) {
      if (!this.userConnections.has(socket.userId)) {
        this.userConnections.set(socket.userId, new Set());
      }
      this.userConnections.get(socket.userId)!.add(socket.id);
    }

    // Store metadata
    const metadata: ConnectionMetadata = {
      id: socket.id,
      userId: socket.userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: new Set(),
      metadata: {},
    };

    this.metadata.set(socket.id, metadata);
    socket.metadata = metadata;

    this.logger.debug(`Connection added to pool: ${socket.id} (Total: ${this.connections.size})`);
    this.emit('connection:added', { socketId: socket.id, userId: socket.userId });

    return true;
  }

  /**
   * Remove a connection from the pool
   */
  public remove(socketId: string): boolean {
    const socket = this.connections.get(socketId);
    if (!socket) {
      return false;
    }

    // Remove from user connections
    if (socket.userId) {
      const userSockets = this.userConnections.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userConnections.delete(socket.userId);
        }
      }
    }

    this.connections.delete(socketId);
    this.metadata.delete(socketId);

    this.logger.debug(
      `Connection removed from pool: ${socketId} (Total: ${this.connections.size})`
    );
    this.emit('connection:removed', { socketId, userId: socket.userId });

    return true;
  }

  /**
   * Get a connection by socket ID
   */
  public get(socketId: string): AuthenticatedSocket | undefined {
    return this.connections.get(socketId);
  }

  /**
   * Get all connections for a user
   */
  public getUserConnections(userId: string): AuthenticatedSocket[] {
    const socketIds = this.userConnections.get(userId);
    if (!socketIds) {
      return [];
    }

    const sockets: AuthenticatedSocket[] = [];
    for (const socketId of socketIds) {
      const socket = this.connections.get(socketId);
      if (socket) {
        sockets.push(socket);
      }
    }

    return sockets;
  }

  /**
   * Get connection metadata
   */
  public getMetadata(socketId: string): ConnectionMetadata | undefined {
    return this.metadata.get(socketId);
  }

  /**
   * Update last activity timestamp
   */
  public updateActivity(socketId: string): void {
    const metadata = this.metadata.get(socketId);
    if (metadata) {
      metadata.lastActivity = new Date();
    }
  }

  /**
   * Get pool statistics
   */
  public getStats(): ConnectionPoolStats {
    const now = Date.now();
    let idle = 0;

    for (const [socketId, metadata] of this.metadata.entries()) {
      const idleTime = now - metadata.lastActivity.getTime();
      if (idleTime > 60000) {
        // Idle for more than 1 minute
        idle++;
      }
    }

    return {
      total: this.connections.size,
      active: this.connections.size - idle,
      idle,
      waiting: 0, // Could be implemented if you have a queue
    };
  }

  /**
   * Get all connections
   */
  public getAllConnections(): AuthenticatedSocket[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get total connection count
   */
  public size(): number {
    return this.connections.size;
  }

  /**
   * Check if pool has capacity
   */
  public hasCapacity(): boolean {
    return this.connections.size < this.maxConnections;
  }

  /**
   * Clear all connections
   */
  public clear(): void {
    this.connections.clear();
    this.userConnections.clear();
    this.metadata.clear();
    this.logger.log('Connection pool cleared');
  }

  /**
   * Start cleanup task for idle connections
   */
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Run every minute
  }

  /**
   * Cleanup idle connections
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [socketId, metadata] of this.metadata.entries()) {
      const idleTime = now - metadata.lastActivity.getTime();
      if (idleTime > this.idleTimeout) {
        toRemove.push(socketId);
      }
    }

    for (const socketId of toRemove) {
      const socket = this.connections.get(socketId);
      if (socket) {
        this.logger.debug(`Disconnecting idle connection: ${socketId}`);
        socket.disconnect(true);
        this.remove(socketId);
        this.emit('connection:idle-timeout', { socketId });
      }
    }

    if (toRemove.length > 0) {
      this.logger.log(`Cleaned up ${toRemove.length} idle connections`);
    }
  }

  /**
   * Stop cleanup task
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}
