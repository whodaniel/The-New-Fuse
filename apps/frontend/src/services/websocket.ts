import EventEmitter from 'events';

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 1000;
    this.wsUrl = this.getWebSocketUrl();
    this.connect();
  }

  getWebSocketUrl() {
    // Check environment variable first
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    // Determine based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    // In production (thenewfuse.com), connect to the API subdomain or Railway URL
    if (host.includes('thenewfuse.com')) {
      return `wss://thenewfuse.com/ws`;
    }

    // In development or Railway preview
    if (host.includes('railway.app')) {
      return `${protocol}//${host}/ws`;
    }

    // Default to localhost for local development
    return 'ws://localhost:3001';
  }

  connect() {
    try {
      console.log(`Connecting to WebSocket: ${this.wsUrl}`);
      this.socket = new WebSocket(this.wsUrl);
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
    if (
      ((_a = this.socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN
    ) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }
}

export const webSocketService = new WebSocketService();
