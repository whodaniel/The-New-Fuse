export declare class ConnectionManager {
    constructor();
    connectAndSend(message: any, options?: {}): Promise<void>;
    waitForConnection(timeout: any): Promise<unknown>;
}
