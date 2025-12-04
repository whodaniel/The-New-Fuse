interface WebSocketOptions {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
    onReconnectAttempt?: (attempt: number) => void;
    onMaxReconnectAttempts?: () => void;
    autoReconnect?: boolean;
}
export declare function useWebSocket(options?: WebSocketOptions): any;
export {};
