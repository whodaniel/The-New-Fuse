export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

export interface SubscriptionConfig {
  key: string;
  callback: (data: any) => void;
  filter?: (data: any) => boolean;
  errorCallback?: (error: Error) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private subscriptions: Map<string, SubscriptionConfig> = new Map();
  private reconnectTimer: any = null;
  private reconnectAttempt = 0;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnect: true,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      ...config,
    };
    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.config.onOpen?.();
        this.notifySubscribers({ type: 'connection', status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (event) => {
        const error = new Error('WebSocket error');
        this.config.onError?.(error);
        this.notifySubscribers({ type: 'error', error });
      };

      this.ws.onclose = () => {
        this.config.onClose?.();
        this.notifySubscribers({ type: 'connection', status: 'disconnected' });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (
      !this.config.reconnect ||
      (this.config.reconnectAttempts && this.reconnectAttempt >= this.config.reconnectAttempts)
    ) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.connect();
    }, this.config.reconnectDelay);
  }

  public subscribe(config: SubscriptionConfig): () => void {
    this.subscriptions.set(config.key, config);
    return () => {
      this.subscriptions.delete(config.key);
    };
  }

  private notifySubscribers(data: any): void {
    this.subscriptions.forEach((subscription) => {
      try {
        if (!subscription.filter || subscription.filter(data)) {
          subscription.callback(data);
        }
      } catch (error) {
        subscription.errorCallback?.(error as Error);
      }
    });
  }

  public send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}
