export interface MCPTool {
    serverId: string;
    serverName: string;
    tool: {
        name: string;
        description: string;
        parameters: any;
    };
}
export interface MCPServer {
    id: string;
    name: string;
    config: {
        tools?: MCPTool[];
    };
}
export interface MCPManager {
    initialize(): Promise<void>;
    executeTool(serverId: string, toolName: string, params: any): Promise<any>;
    getServers(): Promise<MCPServer[]>;
    getTools(): Promise<MCPTool[]>;
    showToolTestDialog(): Promise<void>;
    showMarketplaceBrowser(): Promise<void>;
    addServerFromMarketplace(): Promise<void>;
}
export interface MCPMarketplaceService {
    servers: Promise<MCPServer[]>;
    tools: MCPTool[];
    initialize(): Promise<void>;
}
//# sourceMappingURL=mcp.d.ts.map