export interface ACPServerOptions {
    port?: number;
    hostname?: string;
    cwd?: string;
}
export interface ACPMessage {
    id: string;
    type: 'request' | 'response' | 'notification';
    method?: string;
    params?: Record<string, unknown>;
    result?: unknown;
    error?: {
        code: number;
        message: string;
    };
}
export declare class ACPService {
    private httpServer;
    private wsServer;
    private clients;
    private sessions;
    private options;
    constructor(options?: ACPServerOptions);
    start(): Promise<{
        port: number;
        hostname: string;
    }>;
    stop(): Promise<void>;
    private handleHttpRequest;
    private handleWebSocketConnection;
    private handleACPMessage;
    private broadcast;
}
//# sourceMappingURL=ACPService.d.ts.map