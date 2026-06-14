export interface MCPServerConfig {
    name: string;
    type?: 'local' | 'remote' | 'sse' | 'ws';
    command: string;
    args?: string[];
    env?: Record<string, string>;
    environment?: Record<string, string>;
    cwd?: string;
    transport?: 'stdio' | 'sse' | 'ws';
    url?: string;
    enabled?: boolean;
    oauth?: {
        enabled: boolean;
        authorizeUrl?: string;
        tokenUrl?: string;
        scopes?: string[];
    };
}
export interface MCPServerStatus {
    name: string;
    type?: 'local' | 'remote' | 'sse' | 'ws';
    enabled: boolean;
    configured: boolean;
    running: boolean;
    pid?: number;
    port?: number;
    oauth?: {
        enabled: boolean;
        authenticated: boolean;
        expiry?: string;
    };
}
export interface MCPToolStatus {
    name: string;
    type?: 'local' | 'remote' | 'sse' | 'ws';
    enabled: boolean;
    configured: boolean;
    running: boolean;
}
export interface OAuthCredential {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    scopes?: string[];
}
export declare class MCPManagerService {
    private configDir;
    private servers;
    private processes;
    private credentials;
    constructor(configDir?: string);
    private loadConfig;
    private loadCredentials;
    private saveCredentials;
    addServer(name: string, config: Omit<MCPServerConfig, 'name'>): void;
    private saveConfig;
    removeServer(name: string): boolean;
    enableServer(name: string): boolean;
    disableServer(name: string): boolean;
    listTools(enabledOnly?: boolean): Promise<MCPToolStatus[]>;
    enableTool(name: string): Promise<{
        success: boolean;
        message: string;
    }>;
    disableTool(name: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listServers(): MCPServerStatus[];
    startServer(name: string): Promise<{
        pid: number;
    }>;
    stopServer(name: string): boolean;
    authenticate(name: string): Promise<{
        url: string;
        code?: string;
    }>;
    setCredentials(name: string, cred: OAuthCredential): void;
    getCredentials(name: string): OAuthCredential | undefined;
    logout(name: string): boolean;
    debugConnection(name: string): Promise<{
        server: MCPServerConfig | undefined;
        status: MCPServerStatus | undefined;
        credential: OAuthCredential | undefined;
        diagnostics: string[];
    }>;
}
//# sourceMappingURL=MCPManagerService.d.ts.map