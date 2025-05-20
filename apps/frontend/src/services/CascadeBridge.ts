import { WebSocketService } from './websocket.js';
import { LoggingService } from './logging.js';
export class CascadeBridge extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this.messageQueue = [];
        this.ws = WebSocketService.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupWebSocketListeners();
    }
    static getInstance() {
        if (!CascadeBridge.instance) {
            CascadeBridge.instance = new CascadeBridge();
        }
        return CascadeBridge.instance;
    }
    setupWebSocketListeners() {
        this.ws.on('open', () => {
            this.connected = true;
            this.logger.info('CascadeBridge: Connected to WebSocket');
            this.processMessageQueue();
            this.emit('connected');
        });
        this.ws.on('close', () => {
            this.connected = false;
            this.logger.warn('CascadeBridge: Disconnected from WebSocket');
            this.emit('disconnected');
        });
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(message);
            }
            catch (error) {
                this.logger.error('CascadeBridge: Error parsing message', error);
            }
        });
        this.ws.on('error', (error) => {
            this.logger.error('CascadeBridge: WebSocket error', error);
            this.emit('error', error);
        });
    }
    async processMessageQueue() {
        if (this.connected && this.messageQueue.length > 0) {
            const messages = [...this.messageQueue];
            this.messageQueue = [];
            for (const message of messages) {
                try {
                    await this.send(message);
                }
                catch (error) {
                    this.logger.error('CascadeBridge: Error sending queued message', error);
                    this.messageQueue.push(message);
                }
            }
        }
    }
    handleMessage(message) {
        this.logger.debug('CascadeBridge: Received message', { type: message.type });
        this.emit('message', message);
        this.emit(message.type, message.payload);
    }
    async send(message) {
        if (!this.connected) {
            this.logger.warn('CascadeBridge: Not connected, queueing message', { type: message.type });
            this.messageQueue.push(message);
            return;
        }
        try {
            await this.ws.send(JSON.stringify(message));
            this.logger.debug('CascadeBridge: Sent message', { type: message.type });
        }
        catch (error) {
            this.logger.error('CascadeBridge: Error sending message', error);
            throw error;
        }
    }
    isConnected() {
        return this.connected;
    }
    getQueuedMessages() {
        return [...this.messageQueue];
    }
    clearMessageQueue() {
        this.messageQueue = [];
    }
}
//# sourceMappingURL=CascadeBridge.js.map