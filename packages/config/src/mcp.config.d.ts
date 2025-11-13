export declare const mcpConfig: {
    readonly defaultWsPort: number;
    readonly timeout: number;
    readonly retryAttempts: number;
    readonly retryDelay: number;
    readonly maxConnections: number;
    readonly heartbeatInterval: number;
    readonly errors: {
        readonly noConnectedTab: "No connected tab available";
        readonly connectionTimeout: "Connection timeout";
        readonly invalidMessage: "Invalid message format";
        readonly serverError: "Internal server error";
    };
    readonly websocket: {
        readonly pingInterval: 30000;
        readonly pongTimeout: 5000;
        readonly maxPayload: number;
    };
    readonly browser: {
        readonly headless: boolean;
        readonly timeout: number;
        readonly viewport: {
            readonly width: number;
            readonly height: number;
        };
    };
};
export type McpConfig = typeof mcpConfig;
//# sourceMappingURL=mcp.config.d.ts.map