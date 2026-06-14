export interface ServeOptions {
    port?: number;
    hostname?: string;
    mdns?: boolean;
    mdnsDomain?: string;
    cors?: string[];
    cwd?: string;
}
export interface ServeStatus {
    port: number;
    hostname: string;
    pid: number;
    url: string;
    startedAt: string;
}
export declare class ServeService {
    private httpServer;
    private wsServer;
    private clients;
    private options;
    constructor(options?: ServeOptions);
    start(): Promise<ServeStatus>;
    private handleHttpRequest;
    private handleWebSocketConnection;
    private handleMessage;
    private executeCommand;
    private broadcastMDNS;
    stop(): Promise<void>;
}
//# sourceMappingURL=ServeService.d.ts.map