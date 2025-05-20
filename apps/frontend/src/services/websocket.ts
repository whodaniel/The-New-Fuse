import EventEmitter from 'events';

class WebSocketService extends EventEmitter {
    constructor() {
        super();
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = 1000;
        this.connect();
    }

    connect() {
        try {
            this.socket = new WebSocket('ws://localhost:3001');
            this.socket.onopen = () => {
                this.reconnectAttempts = 0;
            };
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.emit(data.type, data.payload);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            this.socket.onclose = (event) => {
                this.emit('connection_closed', event);
                if (!event.wasClean) {
                    this.handleReconnect();
                }
            };
            this.socket.onerror = (error) => {
                this.emit('connection_error', error);
                this.handleReconnect();
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.handleReconnect();
        }
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectTimeout * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    send(type, payload) {
        var _a;
        if (((_a = this.socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        } else {
            console.error('WebSocket is not connected');
        }
    }
}

export const webSocketService = new WebSocketService();
//# sourceMappingURL=websocket.js.map