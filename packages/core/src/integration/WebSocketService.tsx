import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';
import { Logger } from '../logging/LoggingService.js';
import { SecurityPolicy } from '../security/SecurityTypes.js';
import { EventEmitter } from 'events';

@Injectable()
export class WebSocketService extends EventEmitter {
  private server: WebSocket.Server | null = null;
  private clients: Map<string, WebSocket> = new Map();
  private logger: Logger;

  constructor(
    private readonly securityPolicy: SecurityPolicy,
    logger: Logger
  ) {
    super();
    this.logger = logger;
  }

  /**
   * Initialize the WebSocket server on the specified port
   */
  async initialize(port: number): Promise<void> {
    try {
      this.server = new WebSocket.Server({ port });
      this.setupServerEvents();
      this.logger.info(`WebSocket server initialized on port ${port}`);
    } catch (error: unknown) {
      this.logger.error('Failed to initialize WebSocket server', { error });
      throw error;
    }
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupServerEvents(): void {
    if (!this.server) return;

    this.server.on('connection', (socket: WebSocket, request) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, socket);

      this.logger.info('New client connected', { clientId });

      socket.on('message', (data: WebSocket.Data) => {
        this.handleMessage(clientId, data);
      });

      socket.on('close', () => {
        this.handleDisconnect(clientId);
      });

      socket.on('error', (error) => {
        this.handleError(clientId, error);
      });
    });
  }

  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString().slice(2)}`;
  }

  /**
   * Process a message from a client
   */
  private async handleMessage(clientId: string, data: WebSocket.Data): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      
      if (!this.validateMessage(message)) {
        this.logger.warn('Invalid message received', { clientId });
        return;
      }

      this.emit('message', { clientId, message });
      this.logger.debug('Message processed', { clientId, messageType: message.type });
    } catch (error: unknown) {
      this.logger.error('Error processing message', { clientId, error });
    }
  }

  /**
   * Validate a message against security policy and structure requirements
   */
  private validateMessage(message: unknown): boolean {
    if (typeof message !== 'object' || message === null) return false;
    
    const typedMessage = message as { type?: string; payload?: unknown };
    if (!typedMessage.type || typeof typedMessage.type !== 'string') return false;
    if (!typedMessage.payload) return false;

    // Security policy validation
    if (this.securityPolicy.maxMessageSize && 
        JSON.stringify(message).length > this.securityPolicy.maxMessageSize) {
      return false;
    }

    return true;
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(clientId: string): void {
    this.clients.delete(clientId);
    this.emit('disconnect', clientId);
    this.logger.info('Client disconnected', { clientId });
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(clientId: string, error: Error): void {
    this.logger.error('WebSocket error', { clientId, error });
    this.emit('error', { clientId, error });
  }

  /**
   * Broadcast a message to all connected clients
   */
  async broadcast(message: unknown): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Send a message to a specific client
   */
  async sendToClient(clientId: string, message: unknown): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    client.send(JSON.stringify(message));
    return true;
  }

  /**
   * Shut down the WebSocket server
   */
  async shutdown(): Promise<void> {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.terminate();
      }
    });
    
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    this.logger.info('WebSocket server shut down');
  }
}
