import { EventEmitter } from 'events';
export declare class TraeAgent extends EventEmitter {
    private readonly logger;
    private readonly redis;
    private readonly subscriber;
    private isConnected;
    private readonly channels;
    constructor();
    private setupSubscriptions;
    private setupErrorHandling;
    private handleMessage;
    private publishMessage;
    private handleError;
    cleanup(): Promise<void>;
}
