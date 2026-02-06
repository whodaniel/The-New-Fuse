/**
 * WebSocket Transport for The New Fuse Relay System
 *
 * Based on enhanced-tnf-relay.js:412 (startWebSocketServer method)
 * Handles real-time communication with agents and extensions.
 */

import { EventEmitter } from 'events';
import WebSocket, { Server } from 'ws';
import { RelayMessage, Transport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export interface WebSocketTransportConfig {
  port: number;
  logger: Logger;
}

export class WebSocketTransport extends EventEmitter implements Transport {
  public readonly name = 'websocket';
  private config: WebSocketTransportConfig;
  private logger: Logger;
  private wss: Server | null = null;
  private clients: Map<string, WebSocket> = new Map();
  private messageHandlers: ((message: RelayMessage) => void)[] = [];
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: WebSocketTransportConfig) {
    super();
    this.config = config;
    this.logger = config.logger;
  }

  async start(): Promise<boolean> {
    if (this.wss) {
      this.logger.warn('WebSocket server is already running.');
      return true;
    }

    try {
      this.wss = new Server({ port: this.config.port });
      this.logger.info(`WebSocket server started on port ${this.config.port}`);

      this.wss.on('connection', this.handleConnection.bind(this));
      this.startHeartbeat();

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to start WebSocket server: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.wss) {
      this.wss.close(() => {
        this.logger.info('WebSocket server stopped.');
      });
      this.wss = null;
    }
  }

  async send(message: RelayMessage): Promise<boolean> {
    const targetId = message.target;
    if (!targetId) {
      this.logger.warn('Cannot send WebSocket message without a target.');
      return false;
    }

    const client = this.clients.get(targetId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      return true;
    } else {
      this.logger.warn(`Client ${targetId} not found or not connected.`);
      return false;
    }
  }

  onMessage(handler: (message: RelayMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.wss !== null;
  }

  private handleConnection(ws: any): void {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const clientId = this.generateClientId();
    ws.isAlive = true;
    this.clients.set(clientId, ws);
    this.logger.info(`Client connected: ${clientId}`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message: RelayMessage = JSON.parse(data.toString());
        // Assign the client ID to the message source if it's not already set
        if (!message.source) {
          message.source = clientId;
        }
        this.messageHandlers.forEach((handler) => handler(message));
      } catch (error) {
        this.logger.error(
          `Error parsing message from ${clientId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      this.logger.info(`Client disconnected: ${clientId}`);
    });

    ws.on('error', (error: Error) => {
      this.logger.error(`WebSocket error from ${clientId}: ${error.message}`);
    });

    // Send welcome message
    const welcomeMessage: RelayMessage = {
      id: `welcome_${clientId}`,
      type: 'WELCOME',
      source: 'relay-server',
      target: clientId,
      payload: { clientId },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(welcomeMessage));
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws: any, clientId: string) => {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        if (ws.isAlive === false) {
          this.logger.warn(`Client ${clientId} is not alive. Terminating.`);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 30000);
  }

  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
