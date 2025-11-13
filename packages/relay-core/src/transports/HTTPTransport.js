"use strict";
/**
 * HTTP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:333 (startHTTPServer method)
 * Provides a REST API for interacting with the relay.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPTransport = void 0;
const events_1 = require("events");
const express_1 = __importDefault(require("express"));
class HTTPTransport extends events_1.EventEmitter {
    name = 'http';
    config;
    logger;
    server = null;
    messageHandlers = [];
    constructor(config) {
        super();
        this.config = config;
        this.logger = config.logger;
    }
    async start() {
        if (this.server) {
            this.logger.warn('HTTP server is already running.');
            return true;
        }
        try {
            const app = (0, express_1.default)();
            app.use(express_1.default.json());
            app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                next();
            });
            this.setupRoutes(app);
            this.server = app.listen(this.config.port, () => {
                this.logger.info(`HTTP server started on port ${this.config.port});
      });

      return true;
    } catch (error) {`, this.logger.error(`Failed to start HTTP server: ${error instanceof Error ? error.message : String(error)}` `);
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

  async send(message: RelayMessage): Promise<boolean> {
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
    app.get('/status', (req, res) => {
      this.emit('getStatus', (status: any) => {
        res.json(status);
      });
    });

    app.get('/agents', (req, res) => {
      this.emit('getAgents', (agents: any) => {
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
                ));
            });
        }
        finally { }
    }
}
exports.HTTPTransport = HTTPTransport;
//# sourceMappingURL=HTTPTransport.js.map