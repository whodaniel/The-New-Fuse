// @ts-nocheck
import EventEmitter from 'events';

interface WebSocketMessagePayload {
  type: string;
  payload: any;
}

class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private wsUrl: string;

  constructor() {
    super();
    this.wsUrl = this.getWebSocketUrl();
    this.connect();
  }

  getWebSocketUrl() {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    const { protocol, hostname, host } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:3001';
    }

    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${host}/ws`;
  }

  private connect(): void {
    try {
      console.log(`Connecting to WebSocket: ${this.wsUrl}`);
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const data: WebSocketMessagePayload = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.emit('connection_closed', event);
        if (!event.wasClean) {
          this.handleReconnect();
        }
      };

      this.socket.onerror = (error: Event) => {
        this.emit('connection_error', error);
        this.handleReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectTimeout * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public send(type: string, payload: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }
}

export const webSocketService = new WebSocketService();
