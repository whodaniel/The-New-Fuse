// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface WebSocketConfig {
  port: number;
  host?: string;
  path?: string;
  ssl?: {
    key: string;
    cert: string;
  };
}

export interface WebSocketHandler {
  onConnection(socket: WebSocket): void;
  onMessage(socket: WebSocket, message: WebSocketMessage): void;
  onClose(socket: WebSocket): void;
  onError(socket: WebSocket, error: Error): void;
}