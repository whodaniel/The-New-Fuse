import { CascadeMessage } from '../services/CascadeBridge.js';
interface ConnectionOptions {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
}
export declare class ConnectionManager {
    private bridge;
    private logger;
    private progressTracker;
    constructor();
    connectAndSend(message: CascadeMessage, options?: ConnectionOptions): Promise<void>;
    private waitForConnection;
}
export {};
