import { config } from '../config';

export type WebSocketEventType =
  | 'agent_status'
  | 'token_update'
  | 'session_update'
  | 'notification'
  | 'subscription_update'
  | 'relay_message'
  | 'mcp_event';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: string;
  source?: string;
}

export type MessageHandler = (message: WebSocketMessage) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<WebSocketEventType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private url: string;

  constructor(url?: string) {
    this.url = url || config.webSocketUrl;
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        // Use relay URL if available, otherwise WebSocket URL
        const wsUrl = this.getWebSocketUrl(token);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected to', wsUrl);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();

          // Send authentication if token provided
          if (token) {
            this.send('agent_status', { type: 'auth', token });
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();
          this.attemptReconnect(token);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private getWebSocketUrl(token?: string): string {
    // Try relay URL first (for TNF ecosystem integration)
    const relayUrl = config.relayUrl;
    if (relayUrl && relayUrl.includes('relay')) {
      const wsProtocol = relayUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = relayUrl.replace(/^https?:\/\//, '');
      return `${wsProtocol}://${wsHost}/ws${token ? `?token=${token}` : ''}`;
    }

    // Fallback to configured WebSocket URL
    const url = new URL(this.url);
    if (token) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(eventType: WebSocketEventType, handler: MessageHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  send(type: WebSocketEventType, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date().toISOString(),
        source: 'ai-arcade',
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Subscribe to MCP events from TNF ecosystem
  subscribeToMCPEvents(agentId: string, handler: MessageHandler): () => void {
    this.send('mcp_event', { action: 'subscribe', agentId });
    return this.subscribe('mcp_event', handler);
  }

  // Send message to an agent via MCP
  sendToAgent(agentId: string, message: string, sessionId: string): void {
    this.send('mcp_event', {
      action: 'message',
      agentId,
      message,
      sessionId,
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // Also call any wildcard handlers
    const allHandlers = this.handlers.get('*' as WebSocketEventType);
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message));
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send('agent_status', { type: 'ping' });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(token?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(token).catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService();
  }
  return webSocketService;
}
