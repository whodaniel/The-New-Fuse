export declare const appConfig: {
    readonly name: "Browser MCP Server";
    readonly version: "1.0.0";
    readonly description: "Model Context Protocol server for browser automation";
    readonly environment: string;
    readonly debug: boolean;
    readonly port: number;
    readonly host: string;
    readonly cors: {
        readonly enabled: true;
        readonly origins: readonly ["http://localhost:3000", "http://localhost:3001"];
    };
    readonly logging: {
        readonly level: string;
        readonly format: "json";
    };
};
export type AppConfig = typeof appConfig;
//# sourceMappingURL=app.config.d.ts.map