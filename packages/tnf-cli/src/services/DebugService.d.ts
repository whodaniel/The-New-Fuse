export interface DebugPaths {
    config: string;
    data: string;
    cache: string;
    state: string;
    logs: string;
}
export interface DebugConfig {
    provider?: string;
    model?: string;
    apiBaseUrl?: string;
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