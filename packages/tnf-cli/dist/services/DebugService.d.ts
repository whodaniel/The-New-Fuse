export interface DebugPaths {
    config: string;
    data: string;
    cache: string;
    state: string;
    logs: string;
}
export interface PermissionRules {
    bash: Record<string, 'allow' | 'deny'>;
    read: Record<string, 'allow' | 'deny'>;
    external_directory: Record<string, 'allow' | 'deny'>;
}
export interface InlineMCPServerConfig {
    type?: 'local' | 'remote' | 'sse' | 'ws';
    command: string[] | string;
    environment?: Record<string, string>;
    env?: Record<string, string>;
    cwd?: string;
    enabled?: boolean;
    args?: string[];
    transport?: 'stdio' | 'sse' | 'ws';
    url?: string;
    oauth?: {
        enabled: boolean;
        authorizeUrl?: string;
        tokenUrl?: string;
        scopes?: string[];
    };
}
export interface DebugConfig {
    $schema?: string;
    provider?: string;
    model?: string;
    apiBaseUrl?: string;
    permission?: PermissionRules;
    mcp?: Record<string, InlineMCPServerConfig>;
    mcpServers?: Record<string, unknown>;
    agents?: Record<string, unknown>;
    custom?: Record<string, unknown>;
}
export declare class DebugService {
    private configDir;
    private dataDir;
    constructor();
    getPaths(): DebugPaths;
    getConfig(): DebugConfig;
    getConfigPath(key: string): unknown;
    getProjectConfig(projectRoot?: string): DebugConfig;
    getProjectCommands(projectRoot?: string): Array<{
        name: string;
        filePath: string;
    }>;
    getProjectAgents(projectRoot?: string): Array<{
        name: string;
        filePath: string;
    }>;
    listProjects(): Array<{
        name: string;
        path: string;
        lastAccessed: string;
    }>;
    listSkills(): Array<{
        name: string;
        source: string;
        path: string;
    }>;
    private walkDir;
    debugLSP(): {
        available: boolean;
        version?: string;
        path?: string;
        error?: string;
    };
    debugRg(): {
        available: boolean;
        version?: string;
        path?: string;
        error?: string;
    };
    debugFile(filePath: string): {
        exists: boolean;
        size?: number;
        modified?: string;
        permissions?: string;
        error?: string;
    };
    createSnapshot(outputPath?: string): {
        path: string;
        data: Record<string, unknown>;
    };
}
//# sourceMappingURL=DebugService.d.ts.map