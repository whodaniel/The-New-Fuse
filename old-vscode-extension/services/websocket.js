"use strict";
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
exports.WebSocketService = void 0;
const WebSocket = __importStar(require("ws"));
const logging_1 = require("../core/logging");
const configuration_1 = require("./configuration");
const events_1 = require("events");
class WebSocketService extends events_1.EventEmitter {
    constructor() {
        super();
        this.server = null;
        this.clients = new Set();
        this.logger = logging_1.Logger.getInstance();
        this.config = configuration_1.ConfigurationService.getInstance();
    }
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
    async initialize() {
        try {
            const port = this.config.getSetting('mcpPort', 9229);
            this.server = new WebSocket.Server({ port });
            this.logger.info(`WebSocket server initialized on port ${port}`);
            this.server.on('connection', (ws) => {
                this.handleConnection(ws);
            });
            this.server.on('error', (error) => {
                this.logger.error('WebSocket server error:', error);
                this.emit('error', error);
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize WebSocket server:', error);
            throw error;
        }
    }
    handleConnection(ws) {
        this.clients.add(ws);
        this.logger.info(`New client connected. Total clients: ${this.clients.size}`);
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.logger.debug('Received message:', message);
                this.emit('message', message, ws);
                this.handleMessage(message, ws);
            }
            catch (error) {
                this.logger.error('Error processing message:', error);
                this.sendError(ws, 'Invalid message format');
            }
        });
        ws.on('close', () => {
            this.clients.delete(ws);
            this.logger.info(`Client disconnected. Total clients: ${this.clients.size}`);
        });
        ws.on('error', (error) => {
            this.logger.error('WebSocket client error:', error);
            this.clients.delete(ws);
        });
    }
    handleMessage(message, sender) {
        switch (message.type) {
            case 'heartbeat':
                this.handleHeartbeat(sender);
                break;
            case 'broadcast':
                this.broadcast(message);
                break;
            default:
                this.emit(message.type, message.payload, sender);
        }
    }
    handleHeartbeat(ws) {
        ws.send(JSON.stringify({
            type: 'heartbeat',
            payload: { status: 'alive' },
            timestamp: Date.now()
        }));
    }
    broadcast(message, excludeSender) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client !== excludeSender && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
        this.logger.debug(`Broadcasted message to ${this.clients.size} clients:`, message);
    }
    sendTo(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            this.logger.debug('Sent message to client:', message);
        }
    }
    sendError(ws, error) {
        const errorMessage = {
            type: 'error',
            payload: { error },
            timestamp: Date.now()
        };
        this.sendTo(ws, errorMessage);
    }
    dispose() {
        this.clients.forEach(client => {
            client.close();
        });
        this.server?.close();
        this.logger.info('WebSocket service disposed');
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=websocket.js.map