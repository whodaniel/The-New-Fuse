import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards, Inject, Optional } from '@nestjs/common';
import { Server } from 'socket.io';
import { AuthenticatedSocket, WebSocketConfig } from './types';
import { ConnectionPool } from './connection/connection-pool';
import { ConnectionManager } from './connection/connection-manager';
import { RedisWebSocketAdapter } from './adapters/redis-adapter';
import { MessageQueue } from './queue/message-queue';
import { WebSocketMonitoring } from './monitoring/websocket-metrics';
import { CompressionMiddleware } from './utils/compression';
import { MessageSerializer } from './utils/binary-protocol';

@Injectable()
@NestWebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectionPool: ConnectionPool;
  private readonly connectionManager: ConnectionManager;
  private readonly messageQueue: MessageQueue;
  private readonly monitoring: WebSocketMonitoring;
  private readonly compressionMiddleware: CompressionMiddleware;

  constructor(
    @Inject('WEBSOCKET_CONFIG') private readonly config: WebSocketConfig,
    @Optional() private readonly redisAdapter?: RedisWebSocketAdapter
  ) {
    // Initialize connection pool
    this.connectionPool = new ConnectionPool(
      config?.connectionPool?.maxConnections ?? 10000,
      config?.connectionPool?.idleTimeout ?? 300000
    );

    // Initialize connection manager
    this.connectionManager = new ConnectionManager(
      this.connectionPool,
      config?.heartbeat?.interval ?? 30000,
      config?.heartbeat?.timeout ?? 60000
    );

    // Initialize message queue
    this.messageQueue = new MessageQueue({
      maxSize: config?.messageQueue?.maxSize ?? 10000,
      ttl: config?.messageQueue?.ttl ?? 3600000,
      processingInterval: 100,
      maxRetries: 3,
    });

    // Initialize monitoring
    this.monitoring = new WebSocketMonitoring();

    // Initialize compression middleware
    this.compressionMiddleware = new CompressionMiddleware(config?.compression?.threshold ?? 1024);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Gateway initialization
   */
  async afterInit(server: Server): Promise<void> {
    this.logger.log('WebSocket Gateway initialized');

    // Setup Redis adapter if available
    if (this.redisAdapter) {
      await this.redisAdapter.initialize();
      this.redisAdapter.setupSocketIO(server);
    }

    // Start message queue
    if (this.config?.messageQueue?.enabled) {
      this.messageQueue.start();
    }
  }

  /**
   * Handle new connection
   */
  handleConnection(client: AuthenticatedSocket): void {
    try {
      this.connectionManager.handleConnection(client);
      this.monitoring.recordConnection(true);

      client.emit('connected', {
        id: client.id,
        timestamp: new Date(),
      });

      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      this.monitoring.recordConnection(false);
      this.monitoring.recordError('connection');
      client.disconnect(true);
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(client: AuthenticatedSocket): void {
    this.connectionManager.handleDisconnection(client, 'client_disconnect');
    this.monitoring.recordDisconnection();
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle message from client
   */
  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: any
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Record incoming message
      this.monitoring.recordMessage('inbound', payload.channel);

      // Process compression if needed
      let data = payload.data;
      if (payload.compressed) {
        data = this.compressionMiddleware.processIncoming(
          data,
          payload.compressed,
          payload.algorithm
        );
      }

      // Handle message based on type
      if (payload.broadcast) {
        this.broadcast(payload.channel, data);
      } else if (payload.userId) {
        this.sendToUser(payload.userId, payload.channel, data);
      } else {
        client.emit(payload.channel, data);
      }

      // Record processing time
      const processingTime = Date.now() - startTime;
      this.monitoring.recordProcessingTime(processingTime, payload.channel);
    } catch (error) {
      this.logger.error(`Error handling message: ${error}`);
      this.monitoring.recordError('message_handling');
      client.emit('error', { message: 'Failed to process message' });
    }
  }

  /**
   * Broadcast message to all clients
   */
  public broadcast(channel: string, data: any): void {
    const startTime = Date.now();

    try {
      // Apply compression if beneficial
      const processed = this.compressionMiddleware.processOutgoing(data);

      const message = {
        channel,
        data: processed.data,
        compressed: processed.compressed,
        algorithm: processed.algorithm,
        timestamp: new Date(),
      };

      this.server.emit(channel, message);
      this.monitoring.recordMessage('outbound', channel);

      const latency = Date.now() - startTime;
      this.monitoring.recordMessageLatency(latency, channel);
    } catch (error) {
      this.logger.error(`Broadcast error: ${error}`);
      this.monitoring.recordError('broadcast');
    }
  }

  /**
   * Send message to specific user
   */
  public sendToUser(userId: string, channel: string, data: any): void {
    const startTime = Date.now();

    try {
      // Apply compression
      const processed = this.compressionMiddleware.processOutgoing(data);

      const message = {
        channel,
        data: processed.data,
        compressed: processed.compressed,
        algorithm: processed.algorithm,
        timestamp: new Date(),
      };

      this.connectionManager.sendToUser(userId, channel, message);
      this.monitoring.recordMessage('outbound', channel);

      const latency = Date.now() - startTime;
      this.monitoring.recordMessageLatency(latency, channel);
    } catch (error) {
      this.logger.error(`Send to user error: ${error}`);
      this.monitoring.recordError('send_to_user');
    }
  }

  /**
   * Send message to room
   */
  public sendToRoom(room: string, channel: string, data: any): void {
    const startTime = Date.now();

    try {
      // Apply compression
      const processed = this.compressionMiddleware.processOutgoing(data);

      const message = {
        channel,
        data: processed.data,
        compressed: processed.compressed,
        algorithm: processed.algorithm,
        timestamp: new Date(),
      };

      this.connectionManager.sendToRoom(room, channel, message);
      this.monitoring.recordMessage('outbound', channel);

      const latency = Date.now() - startTime;
      this.monitoring.recordMessageLatency(latency, channel);
    } catch (error) {
      this.logger.error(`Send to room error: ${error}`);
      this.monitoring.recordError('send_to_room');
    }
  }

  /**
   * Queue message for delivery
   */
  public queueMessage(channel: string, data: any, priority: number = 0): string {
    return this.messageQueue.enqueue(channel, data, priority);
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats() {
    return this.connectionManager.getStats();
  }

  /**
   * Get metrics
   */
  public async getMetrics() {
    return this.monitoring.getMetricsJSON();
  }

  /**
   * Get health status
   */
  public async getHealth() {
    const queueStats = this.messageQueue.getStats();
    return this.monitoring.getHealthStatus({
      redis: this.redisAdapter !== undefined,
      queueSize: queueStats.size,
    });
  }

  /**
   * Setup event listeners for queue
   */
  private setupEventListeners(): void {
    // Queue events
    this.messageQueue.on('message:process', (item) => {
      this.broadcast(item.channel, item.data);
    });

    this.messageQueue.on('queue:full', () => {
      this.logger.warn('Message queue is full');
      this.monitoring.recordError('queue_full');
    });

    // Connection pool events
    this.connectionPool.on('pool:limit-reached', () => {
      this.logger.warn('Connection pool limit reached');
      this.monitoring.recordError('pool_limit');
    });

    // Update metrics periodically
    setInterval(() => {
      const queueStats = this.messageQueue.getStats();
      this.monitoring.updateQueueSize(queueStats.size);
    }, 5000);
  }

  /**
   * Cleanup on shutdown
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down WebSocket Gateway');
    this.messageQueue.destroy();
    this.connectionManager.destroy();
    this.connectionPool.destroy();
  }
}
