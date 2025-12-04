export declare class CommunicationManager extends EventEmitter {
    constructor(config?: {});
    static getInstance(config: any): any;
    connect(url: any): Promise<unknown>;
    setupWebSocketHandlers(resolve: any, reject: any): void;
    handleDisconnect(): void;
    handleMessage(event: any): void;
    startPingInterval(): void;
    stopPingInterval(): void;
    send(event: any): Promise<void>;
    sendMessage(message: any): Promise<void>;
    disconnect(): void;
    isConnected(): boolean;
}
