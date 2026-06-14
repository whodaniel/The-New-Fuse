export interface ClientConfig {
    url: string;
    auth?: {
        token: string;
    };
    reconnection?: {
        enabled: boolean;
        maxAttempts?: number;
        initialDelay?: number;
    };
    compression?: {
        enabled: boolean;
        threshold?: number;
    };
    timeout?: number;
}
export declare class WebSocketTestClient {
    private readonly config;
    private readonly logger;
    private socket?;
    private reconnectionManager?;
    private compressionMiddleware?;
    private connected;
    private messageHandlers;
    constructor(config: ClientConfig);
    connect(): Promise<void>;
    disconnect(): void;
    send(channel: string, data: any, options?: {
        broadcast?: boolean;
        userId?: string;
    }): void;
    on(channel: string, handler: (data: any) => void): void;
    off(channel: string, handler?: (data: any) => void): void;
    joinRoom(room: string): void;
    leaveRoom(room: string): void;
    isConnected(): boolean;
    private setupEventHandlers;
    private handleDisconnect;
}
//# sourceMappingURL=websocket-client.d.ts.map