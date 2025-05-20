interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  auth?: Record<string, any>;
}
export declare const useWebSocket: (options?: WebSocketOptions) => any;
export {};
