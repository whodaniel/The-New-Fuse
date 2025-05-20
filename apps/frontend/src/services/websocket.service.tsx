import { EventEmitter } from 'events';
import { sessionManager } from '@your-org/security';

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly options = {
      reconnectDelay: 2000,
      pingInterval: 30000
    }
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const session = await sessionManager.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set('sessionId', session.id);

    this.ws = new WebSocket(url.toString());
    this.setupEventHandlers();
    this.startPingInterval();
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.ws.onclose = () => {
      this.cleanup();
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
      this.cleanup();
      this.handleReconnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        this.emit('error', new Error('Invalid message format'));
      }
    };
  }

  private handleMessage(message: any): void {
    if (message.type === 'session_expired') {
      this.handleSessionExpired();
      return;
    }

    this.emit(message.type, message.payload);
  }

  private async handleSessionExpired(): Promise<void> {
    try {
      await sessionManager.refreshSession();
      await this.reconnect();
    } catch (error) {
      this.emit('session_error', error);
      // Redirect to login or handle session error
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts');
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        this.emit('error', error);
      });
    }, this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, this.options.pingInterval);
  }

  send(type: string, payload?: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({ type, payload }));
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const webSocketService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000');