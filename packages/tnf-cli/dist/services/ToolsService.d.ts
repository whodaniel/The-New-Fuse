export interface ToolsetConfig {
    name: string;
    description: string;
    enabled: boolean;
    platforms: string[];
    category: string;
    mcpServer?: string;
    source?: 'builtin' | 'mcp-config' | 'user';
}
export declare class ToolsService {
    private readonly configPath;
    private readonly projectRoot;
    constructor();
    private resolveProjectRoot;
    getToolsets(): Promise<ToolsetConfig[]>;
    private loadUserToolsets;
    /**
     * Discover real MCP servers from project configuration files.
     * Reads data/mcp_config.json and tools/config-files/mcp_config.json.
     */
    discoverMCPTools(): ToolsetConfig[];
    saveToolsets(toolsets: ToolsetConfig[]): Promise<void>;
    enableToolset(name: string): Promise<ToolsetConfig>;
    disableToolset(name: string): Promise<ToolsetConfig>;
    getEnabledToolsets(platform?: string): Promise<ToolsetConfig[]>;
    private getBuiltinToolsets;
}
//# sourceMappingURL=ToolsService.d.ts.map