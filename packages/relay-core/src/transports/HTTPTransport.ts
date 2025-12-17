/**
 * HTTP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:333 (startHTTPServer method)
 * Provides a REST API for interacting with the relay.
 */

import { EventEmitter } from 'events';

import express from 'express';

import type { InterceptRule, RelayMessage, Transport } from '../types/index.js';
import type { Logger } from '../utils/Logger.js';
import type { Server } from 'http';

export interface HTTPTransportConfig {
  port: number;
  logger: Logger;
  interceptRules: Map<string, InterceptRule>;
}

export class HTTPTransport extends EventEmitter implements Transport {
  public readonly name = 'http';
  private config: HTTPTransportConfig;
  private logger: Logger;
  private server: Server | null = null;
  private messageHandlers: ((message: RelayMessage) => void)[] = [];

  constructor(config: HTTPTransportConfig) {
    super();
    this.config = config;
    this.logger = config.logger;
  }

  async start(): Promise<boolean> {
    if (this.server) {
      this.logger.warn('HTTP server is already running.');
      return true;
    }

    try {
      const app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
      });

      this.setupRoutes(app);

      this.server = app.listen(this.config.port, () => {
        this.logger.info(`HTTP server started on port ${this.config.port}`);
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to start HTTP server: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close(() => {
        this.logger.info('HTTP server stopped.');
      });
      this.server = null;
    }
  }

  async send(_message: RelayMessage): Promise<boolean> {
    // HTTP transport is typically for receiving messages, not sending them directly.
    // Outbound messages should be handled by other transports (e.g., WebSocket, Redis).
    this.logger.warn('HTTP transport does not support sending messages directly.');
    return false;
  }

  onMessage(handler: (message: RelayMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.server !== null;
  }

  private setupRoutes(app: express.Express): void {
    app.get('/status', (_req, res) => {
      this.emit('getStatus', (status: unknown) => {
        res.json(status);
      });
    });

    app.get('/agents', (_req, res) => {
      this.emit('getAgents', (agents: unknown) => {
        res.json(agents);
      });
    });

    app.get('/intercept-rules', (req, res) => {
      res.json({ rules: Array.from(this.config.interceptRules.entries()) });
    });

    app.post('/send-message', (req, res) => {
      const message: RelayMessage = req.body;
      this.messageHandlers.forEach(handler => handler(message));
      res.json({ success: true, message: 'Message received' });
    });
  }
}
