export declare class ServerManager {
    private static instance;
    private server?;
    private port;
    private constructor();
    static getInstance(port?: number): ServerManager;
    start(): Promise<void>;
    stop(): Promise<void>;
    private killExistingProcess;
    private startServer;
    private waitForServer;
}
