/**
 * HTTP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:333 (startHTTPServer method)
 * Provides a REST API for interacting with the relay.
 */
import { EventEmitter } from 'events';
import express from 'express';
export class HTTPTransport extends EventEmitter {
    constructor(config) {
        super();
        this.name = 'http';
        this.server = null;
        this.messageHandlers = [];
        this.config = config;
        this.logger = config.logger;
    }
    async start() {
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
        }
        catch (error) {
            this.logger.error(`Failed to start HTTP server: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    async stop() {
        if (this.server) {
            this.server.close(() => {
                this.logger.info('HTTP server stopped.');
            });
            this.server = null;
        }
    }
    async send(_message) {
        // HTTP transport is typically for receiving messages, not sending them directly.
        // Outbound messages should be handled by other transports (e.g., WebSocket, Redis).
        this.logger.warn('HTTP transport does not support sending messages directly.');
        return false;
    }
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    isConnected() {
        return this.server !== null;
    }
    setupRoutes(app) {
        app.get('/status', (_req, res) => {
            this.emit('getStatus', (status) => {
                res.json(status);
            });
        });
        app.get('/agents', (_req, res) => {
            this.emit('getAgents', (agents) => {
                res.json(agents);
            });
        });
        app.get('/intercept-rules', (req, res) => {
            res.json({ rules: Array.from(this.config.interceptRules.entries()) });
        });
        app.post('/send-message', (req, res) => {
            const message = req.body;
            this.messageHandlers.forEach(handler => handler(message));
            res.json({ success: true, message: 'Message received' });
        });
    }
}
//# sourceMappingURL=HTTPTransport.js.map