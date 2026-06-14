"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTestClient = void 0;
const socket_io_client_1 = require("socket.io-client");
const common_1 = require("@nestjs/common");
const strategies_js_1 = require("../strategies.js");
const compression_js_1 = require("../utils/compression.js");
class WebSocketTestClient {
    config;
    logger = new common_1.Logger(WebSocketTestClient.name);
    socket;
    reconnectionManager;
    compressionMiddleware;
    connected = false;
    messageHandlers = new Map();
    constructor(config) {
        this.config = config;
        if (config.reconnection?.enabled) {
            const strategy = new strategies_js_1.ExponentialBackoffStrategy(config.reconnection.maxAttempts ?? 10, config.reconnection.initialDelay ?? 1000);
            this.reconnectionManager = new strategies_js_1.ReconnectionManager(strategy);
        }
        if (config.compression?.enabled) {
            this.compressionMiddleware = new compression_js_1.CompressionMiddleware(config.compression.threshold ?? 1024);
        }
    }
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = (0, socket_io_client_1.io)(this.config.url, {
                    auth: this.config.auth,
                    reconnection: false,
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            if (this.reconnectionManager) {
                this.reconnectionManager.cancel();
            }
        }
    }
    send(channel, data, options) {
        if (!this.socket || !this.connected) {
            throw new Error('Not connected to WebSocket server');
        }
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
    on(channel, handler) {
        if (!this.messageHandlers.has(channel)) {
            this.messageHandlers.set(channel, []);
        }
        this.messageHandlers.get(channel).push(handler);
        if (this.socket) {
            this.socket.on(channel, (message) => {
                let data = message.data;
                if (message.compressed && this.compressionMiddleware) {
                    data = this.compressionMiddleware.processIncoming(data, message.compressed, message.algorithm);
                }
                handler(data);
            });
        }
    }
    off(channel, handler) {
        if (handler) {
            const handlers = this.messageHandlers.get(channel);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }
        }
        else {
            this.messageHandlers.delete(channel);
        }
        if (this.socket) {
            this.socket.off(channel, handler);
        }
    }
    joinRoom(room) {
        if (this.socket) {
            this.socket.emit('join:room', room);
        }
    }
    leaveRoom(room) {
        if (this.socket) {
            this.socket.emit('leave:room', room);
        }
    }
    isConnected() {
        return this.connected;
    }
    setupEventHandlers() {
        if (!this.socket)
            return;
        this.socket.on('ping', (data) => {
            this.socket.emit('pong', data);
        });
        this.socket.on('error', (error) => {
            this.logger.error(`Server error: ${error.message}`);
        });
    }
    handleDisconnect() {
        if (this.reconnectionManager) {
            this.reconnectionManager.attemptReconnection(() => this.connect(), () => {
                this.logger.log('Reconnection successful');
            }, (error) => {
                this.logger.error(`Reconnection failed: ${error.message}`);
            });
        }
    }
}
exports.WebSocketTestClient = WebSocketTestClient;
