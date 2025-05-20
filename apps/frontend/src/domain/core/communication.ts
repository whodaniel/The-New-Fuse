import { LoggingService } from '../../services/logging.js';
export class CommunicationManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.ws = null;
        this.reconnectCount = 0;
        this.logger = LoggingService.getInstance();
        this.config = Object.assign({ reconnectAttempts: 5, reconnectInterval: 3000, pingInterval: 30000, timeout: 5000 }, config);
    }
    static getInstance(config) {
        if (!CommunicationManager.instance) {
            CommunicationManager.instance = new CommunicationManager(config);
        }
        return CommunicationManager.instance;
    }
    connect(url) {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);
                this.setupWebSocketHandlers(resolve, reject);
                this.startPingInterval();
            }
            catch (error) {
                this.logger.error('Failed to create WebSocket connection', error);
                reject(error);
            }
        });
    }
    setupWebSocketHandlers(resolve, reject) {
        if (!this.ws)
            return;
        const timeout = setTimeout(() => {
            var _a;
            reject(new Error('Connection timeout'));
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
        }, this.config.timeout);
        this.ws.onopen = () => {
            clearTimeout(timeout);
            this.reconnectCount = 0;
            this.logger.info('WebSocket connection established');
            this.emit('connected');
            resolve();
        };
        this.ws.onclose = () => {
            this.handleDisconnect();
        };
        this.ws.onerror = (error) => {
            this.logger.error('WebSocket error', error);
            this.emit('error', error);
        };
        this.ws.onmessage = (event) => {
            this.handleMessage(event);
        };
    }
    handleDisconnect() {
        this.stopPingInterval();
        this.emit('disconnected');
        this.logger.warn('WebSocket connection closed');
        if (this.reconnectCount < this.config.reconnectAttempts) {
            this.reconnectTimer = setTimeout(() => {
                this.reconnectCount++;
                this.logger.info(`Attempting to reconnect (${this.reconnectCount}/${this.config.reconnectAttempts})`);
                this.connect(this.ws.url).catch(error => {
                    this.logger.error('Reconnection attempt failed', error);
                });
            }, this.config.reconnectInterval);
        }
        else {
            this.logger.error('Max reconnection attempts reached');
            this.emit('reconnect_failed');
        }
    }
    handleMessage(event) {
        try {
            const wsEvent = JSON.parse(event.data);
            this.emit('message', wsEvent);
            this.emit(wsEvent.type, wsEvent.payload);
        }
        catch (error) {
            this.logger.error('Failed to parse WebSocket message', error);
        }
    }
    startPingInterval() {
        this.pingTimer = setInterval(() => {
            var _a;
            if (((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                this.send({
                    type: 'ping',
                    payload: { timestamp: Date.now() }
                });
            }
        }, this.config.pingInterval);
    }
    stopPingInterval() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }
    }
    async send(event) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        try {
            this.ws.send(JSON.stringify(event));
        }
        catch (error) {
            this.logger.error('Failed to send message', error);
            throw error;
        }
    }
    async sendMessage(message) {
        await this.send({
            type: 'message',
            payload: message
        });
    }
    disconnect() {
        this.stopPingInterval();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    isConnected() {
        var _a;
        return ((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN;
    }
}
//# sourceMappingURL=communication.js.map