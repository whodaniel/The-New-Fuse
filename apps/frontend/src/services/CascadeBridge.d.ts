export declare class CascadeBridge extends EventEmitter {
    constructor();
    static getInstance(): any;
    setupWebSocketListeners(): void;
    processMessageQueue(): Promise<void>;
    handleMessage(message: any): void;
    send(message: any): Promise<void>;
    isConnected(): any;
    getQueuedMessages(): any[];
    clearMessageQueue(): void;
}
