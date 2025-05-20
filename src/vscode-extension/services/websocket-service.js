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
const events_1 = require("events");
const logging_1 = require("../core/logging");
const configuration_1 = require("./configuration");
const mcp_handler_1 = require("./mcp-handler");
class WebSocketService extends events_1.EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.clients = new Map();
        this.heartbeatInterval = null;
        this.logger = logging_1.Logger.getInstance();
        this.config = configuration_1.ConfigurationService.getInstance();
        this.mcpHandler = mcp_handler_1.MCPHandler.getInstance();
    }
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
    async initialize() {
        const port = this.config.getSetting('mcpPort') || 9229;
        try {
            this.wss = new WebSocket.Server({ port });
            this.logger.info(`WebSocket server started on port ${port}`);
            this.setupServerEventHandlers();
            this.startHeartbeat();
        }
        catch (error) {
            this.logger.error('Failed to initialize WebSocket server:', error);
            throw error;
        }
    }
    setupServerEventHandlers() {
        if (!this.wss) {
            return;
        }
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, ws);
            this.logger.info(`New WebSocket connection established. Client ID: ${clientId}`);
            ws.on('message', async (message) => {
                try {
                    await this.handleMessage(clientId, message);
                }
                catch (error) {
                    this.logger.error(`Error handling message from client ${clientId}:`, error);
                }
            });
            ws.on('close', () => {
                this.handleClientDisconnection(clientId);
            });
            ws.on('error', (error) => {
                this.logger.error(`WebSocket error for client ${clientId}:`, error);
                this.handleClientDisconnection(clientId);
            });
            // Send initial connection acknowledgment
            this.sendToClient(clientId, {
                type: 'connection_ack',
                clientId,
                timestamp: Date.now()
            });
        });
        this.wss.on('error', (error) => {
            this.logger.error('WebSocket server error:', error);
        });
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async handleMessage(clientId, message) {
        try {
            const parsedMessage = JSON.parse(message.toString());
            this.logger.debug(`Received message from client ${clientId}:`, parsedMessage);
            if (parsedMessage.type === 'heartbeat') {
                this.handleHeartbeat(clientId);
                return;
            }
            // Handle MCP-related messages
            if (parsedMessage.type === 'mcp_request') {
                const response = await this.mcpHandler.handleRequest(parsedMessage.payload, clientId);
                this.sendToClient(clientId, {
                    type: 'mcp_response',
                    requestId: parsedMessage.requestId,
                    payload: response
                });
                return;
            }
            // Emit message event for other handlers
            this.emit('message', {
                clientId,
                message: parsedMessage
            });
        }
        catch (error) {
            this.logger.error(`Failed to handle message from client ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: 'error',
                error: {
                    code: 'MESSAGE_HANDLING_ERROR',
                    message: error.message
                }
            });
        }
    }
    handleHeartbeat(clientId) {
        this.sendToClient(clientId, {
            type: 'heartbeat_ack',
            timestamp: Date.now()
        });
    }
    startHeartbeat() {
        const interval = this.config.getSetting('heartbeatInterval') || 30000;
        this.heartbeatInterval = setInterval(() => {
            this.clients.forEach((ws, clientId) => {
                if (ws.readyState === WebSocket.OPEN) {
                    this.sendToClient(clientId, {
                        type: 'heartbeat',
                        timestamp: Date.now()
                    });
                }
                else {
                    this.handleClientDisconnection(clientId);
                }
            });
        }, interval);
    }
    handleClientDisconnection(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            this.clients.delete(clientId);
            this.logger.info(`Client disconnected: ${clientId}`);
            this.emit('clientDisconnected', clientId);
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        }
    }
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            try {
                const message = JSON.stringify(data);
                client.send(message);
                this.logger.debug(`Sent message to client ${clientId}:`, data);
            }
            catch (error) {
                this.logger.error(`Failed to send message to client ${clientId}:`, error);
            }
        }
        else {
            this.logger.warn(`Attempted to send message to unavailable client: ${clientId}`);
            this.handleClientDisconnection(clientId);
        }
    }
    broadcast(data, excludeClientId) {
        const message = JSON.stringify(data);
        this.clients.forEach((client, clientId) => {
            if (clientId !== excludeClientId && client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                    this.logger.debug(`Broadcast message to client ${clientId}:`, data);
                }
                catch (error) {
                    this.logger.error(`Failed to broadcast to client ${clientId}:`, error);
                    this.handleClientDisconnection(clientId);
                }
            }
        });
    }
    getConnectedClients() {
        return Array.from(this.clients.keys());
    }
    isClientConnected(clientId) {
        const client = this.clients.get(clientId);
        return client !== undefined && client.readyState === WebSocket.OPEN;
    }
    dispose() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.clients.forEach((client, clientId) => {
            try {
                client.close();
                this.logger.debug(`Closed connection for client ${clientId}`);
            }
            catch (error) {
                this.logger.error(`Error closing connection for client ${clientId}:`, error);
            }
        });
        this.clients.clear();
        if (this.wss) {
            this.wss.close(() => {
                this.logger.info('WebSocket server shut down');
            });
        }
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=websocket-service.js.map