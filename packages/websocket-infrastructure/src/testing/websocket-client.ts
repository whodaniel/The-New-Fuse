import { io, Socket } from 'socket.io-client';
import { Logger } from '@nestjs/common';
import { ReconnectionManager, ExponentialBackoffStrategy } from '../strategies';
import { CompressionMiddleware } from '../utils/compression';

export interface ClientConfig {
  url: string;
  auth?: {
    token: string;
  };
  reconnection?: {
    enabled: boolean;
    maxAttempts?: number;
    initialDelay?: number;
  };
  compression?: {
    enabled: boolean;
    threshold?: number;
  };
  timeout?: number;
}

export class WebSocketTestClient {
  private readonly logger = new Logger(WebSocketTestClient.name);
  private socket?: Socket;
  private reconnectionManager?: ReconnectionManager;
  private compressionMiddleware?: CompressionMiddleware;
  private connected: boolean = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();

  constructor(private readonly config: ClientConfig) {
    if (config.reconnection?.enabled) {
      const strategy = new ExponentialBackoffStrategy(
        config.reconnection.maxAttempts ?? 10,
        config.reconnection.initialDelay ?? 1000
      );
      this.reconnectionManager = new ReconnectionManager(strategy);
    }

    if (config.compression?.enabled) {
      this.compressionMiddleware = new CompressionMiddleware(config.compression.threshold ?? 1024);
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.url, {
          auth: this.config.auth,
          reconnection: false, // We handle reconnection ourselves
          timeout: this.config.timeout ?? 20000,
          transports: ['websocket'],
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.logger.log('Connected to WebSocket server');
          this.setupEventHandlers();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          this.logger.error(`Connection error: ${error.message}`);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          this.connected = false;
          this.logger.log(`Disconnected: ${reason}`);
          this.handleDisconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      if (this.reconnectionManager) {
        this.reconnectionManager.cancel();
      }
    }
  }

  /**
   * Send message to server
   */
  send(channel: string, data: any, options?: { broadcast?: boolean; userId?: string }): void {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected to WebSocket server');
    }

    // Apply compression if enabled
    let processedData = data;
    let compressed = false;
    let algorithm;

    if (this.compressionMiddleware) {
      const result = this.compressionMiddleware.processOutgoing(data);
      processedData = result.data;
      compressed = result.compressed;
      algorithm = result.algorithm;
    }

    this.socket.emit('message', {
      channel,
      data: processedData,
      compressed,
      algorithm,
      ...options,
    });

    this.logger.debug(`Sent message to channel: ${channel}`);
  }

  /**
   * Subscribe to channel
   */
  on(channel: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, []);
    }
    this.messageHandlers.get(channel)!.push(handler);

    if (this.socket) {
      this.socket.on(channel, (message) => {
        // Decompress if needed
        let data = message.data;
        if (message.compressed && this.compressionMiddleware) {
          data = this.compressionMiddleware.processIncoming(
            data,
            message.compressed,
            message.algorithm
          );
        }

        handler(data);
      });
    }
  }

  /**
   * Unsubscribe from channel
   */
  off(channel: string, handler?: (data: any) => void): void {
    if (handler) {
      const handlers = this.messageHandlers.get(channel);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.messageHandlers.delete(channel);
    }

    if (this.socket) {
      this.socket.off(channel, handler);
    }
  }

  /**
   * Join room
   */
  joinRoom(room: string): void {
    if (this.socket) {
      this.socket.emit('join:room', room);
    }
  }

  /**
   * Leave room
   */
  leaveRoom(room: string): void {
    if (this.socket) {
      this.socket.emit('leave:room', room);
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Handle ping from server
    this.socket.on('ping', (data) => {
      this.socket!.emit('pong', data);
    });

    // Handle errors
    this.socket.on('error', (error) => {
      this.logger.error(`Server error: ${error.message}`);
    });
  }

  /**
   * Handle disconnection with reconnection logic
   */
  private handleDisconnect(): void {
    if (this.reconnectionManager) {
      this.reconnectionManager.attemptReconnection(
        () => this.connect(),
        () => {
          this.logger.log('Reconnection successful');
        },
        (error) => {
          this.logger.error(`Reconnection failed: ${error.message}`);
        }
      );
    }
  }
}
