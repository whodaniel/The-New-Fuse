import { EventEmitter } from 'events';
export interface CascadeMessage {
    type: string;
    payload: any;
    metadata?: Record<string, any>;
}
export declare class CascadeBridge extends EventEmitter {
    private static instance;
    private ws;
    private logger;
    private connected;
    private messageQueue;
    private constructor();
    static getInstance(): CascadeBridge;
    private setupWebSocketListeners;
    private processMessageQueue;
    private handleMessage;
    send(message: CascadeMessage): Promise<void>;
    isConnected(): boolean;
    getQueuedMessages(): CascadeMessage[];
    clearMessageQueue(): void;
}
