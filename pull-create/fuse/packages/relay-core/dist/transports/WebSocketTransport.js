"use strict";
/**
 * WebSocket Transport for The New Fuse Relay System
 *
 * Based on enhanced-tnf-relay.js:412 (startWebSocketServer method)
 * Handles real-time communication with agents and extensions.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTransport = void 0;
const events_1 = require("events");
const ws_1 = __importStar(require("ws"));
class WebSocketTransport extends events_1.EventEmitter {
    name = 'websocket';
    config;
    logger;
    wss = null;
    clients = new Map();
    messageHandlers = [];
    heartbeatInterval;
    constructor(config) {
        super();
        this.config = config;
        this.logger = config.logger;
    }
    async start() {
        if (this.wss) {
            this.logger.warn('WebSocket server is already running.');
            return true;
        }
        try {
            this.wss = new ws_1.Server({ port: this.config.port });
            this.logger.info(`WebSocket server started on port ${this.config.port}`);
            this.wss.on('connection', this.handleConnection.bind(this));
            this.startHeartbeat();
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start WebSocket server: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    async stop() {
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
    async send(message) {
        const targetId = message.target;
        if (!targetId) {
            this.logger.warn('Cannot send WebSocket message without a target.');
            return false;
        }
        const client = this.clients.get(targetId);
        if (client && client.readyState === ws_1.default.OPEN) {
            client.send(JSON.stringify(message));
            return true;
        }
        else {
            this.logger.warn(`Client ${targetId} not found or not connected.`);
            return false;
        }
    }
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    isConnected() {
        return this.wss !== null;
    }
    handleConnection(ws) {
        const clientId = this.generateClientId();
        ws.isAlive = true;
        this.clients.set(clientId, ws);
        this.logger.info(`Client connected: ${clientId}`);
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                // Assign the client ID to the message source if it's not already set
                if (!message.source) {
                    message.source = clientId;
                }
                this.messageHandlers.forEach(handler => handler(message));
            }
            catch (error) {
                this.logger.error(`Error parsing message from ${clientId}: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        ws.on('close', () => {
            this.clients.delete(clientId);
            this.logger.info(`Client disconnected: ${clientId}`);
        });
        ws.on('error', (error) => {
            this.logger.error(`WebSocket error from ${clientId}: ${error.message}`);
        });
        // Send welcome message
        const welcomeMessage = {
            id: `welcome_${clientId}`,
            type: 'WELCOME',
            source: 'relay-server',
            target: clientId,
            payload: { clientId },
            timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(welcomeMessage));
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.clients.forEach((ws, clientId) => {
                if (ws.isAlive === false) {
                    this.logger.warn(`Client ${clientId} is not alive. Terminating.`);
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping(() => { });
            });
        }, 30000);
    }
    generateClientId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.WebSocketTransport = WebSocketTransport;
//# sourceMappingURL=WebSocketTransport.js.map