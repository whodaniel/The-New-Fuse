import { DatabaseService } from '@the-new-fuse/database';
import { MarketplaceService } from '../modules/marketplace/marketplace.service';
export declare class MCPServerController {
    private readonly db;
    private readonly marketplaceService;
    constructor(db: DatabaseService, marketplaceService: MarketplaceService);
    private get tnfMcpServers();
    /**
     * GET /api/mcp/servers
     * Returns MCP servers from TNF curated list, with optional source=registry for official MCP registry.
     * Supports ?source=tnf|registry|all&q=<search>&scope=usr|sys|ext
     */
    getAllServers(source?: string, q?: string, scope?: string): Promise<{
        servers: any[];
    }>;
    /**
     * GET /api/mcp/servers/marketplace
     * Returns marketplace MCP servers from the AI assets marketplace.
     */
    getMarketplaceServers(q?: string, limit?: string): Promise<{
        id: number;
        sourceId: number | null;
        serverName: string;
        serverUrl: string | null;
        repoUrl: string | null;
        description: string | null;
        tags: string | null;
        maintainer: string | null;
        stars: number | null;
        license: string | null;
        transport: string | null;
        createdAt: string | null;
    }[]>;
    /**
     * GET /api/mcp/servers/:id
     * Get a single server by TNF ID or registry name.
     */
    getServerById(id: string): Promise<{
        source: string;
        id: string;
        tnfId: string;
        name: string;
        description: string | null;
        protocol: string;
        transport: string | null;
        command: string | null;
        args: string[] | null;
        env: Record<string, string> | null;
        endpointUrl: string | null;
        tools: string[] | null;
        resources: string[] | null;
        authMethod: string | null;
        status: "deprecated" | "active" | "inactive" | "offline" | "available" | "unavailable";
        scope: "base" | "sys" | "usr" | "ext";
        ownerId: string | null;
        metadata: unknown;
        createdAt: Date;
        updatedAt: Date;
        error?: undefined;
    } | {
        source: string;
        id: number;
        sourceId: number | null;
        serverName: string;
        serverUrl: string | null;
        repoUrl: string | null;
        description: string | null;
        tags: string | null;
        maintainer: string | null;
        stars: number | null;
        license: string | null;
        transport: string | null;
        createdAt: string | null;
        error?: undefined;
    } | {
        error: string;
    }>;
    /**
     * POST /api/mcp/servers
     * Register a new custom MCP server for the user.
     */
    registerServer(serverData: any, req: any): Promise<{
        success: boolean;
        server: {
            description: string | null;
            name: string;
            status: "deprecated" | "active" | "inactive" | "offline" | "available" | "unavailable";
            id: string;
            createdAt: Date;
            updatedAt: Date;
            metadata: unknown;
            transport: string | null;
            ownerId: string | null;
            tnfId: string;
            authMethod: string | null;
            endpointUrl: string | null;
            protocol: string;
            command: string | null;
            args: string[] | null;
            env: Record<string, string> | null;
            tools: string[] | null;
            resources: string[] | null;
            scope: "base" | "sys" | "usr" | "ext";
        };
    }>;
    /**
     * PUT /api/mcp/servers/:id
     * Update a user's custom MCP server.
     */
    updateServer(id: string, config: any, req: any): Promise<{
        success: boolean;
        server: {
            id: string;
            tnfId: string;
            name: string;
            description: string | null;
            protocol: string;
            transport: string | null;
            command: string | null;
            args: string[] | null;
            env: Record<string, string> | null;
            endpointUrl: string | null;
            tools: string[] | null;
            resources: string[] | null;
            authMethod: string | null;
            status: "deprecated" | "active" | "inactive" | "offline" | "available" | "unavailable";
            scope: "base" | "sys" | "usr" | "ext";
            ownerId: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        error?: undefined;
    } | {
        error: string;
        success?: undefined;
        server?: undefined;
    }>;
    /**
     * DELETE /api/mcp/servers/:id
     * Remove a user's custom MCP server.
     */
    deleteServer(id: string, req: any): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: string;
        success?: undefined;
    }>;
    startServer(id: string): Promise<{
        success: boolean;
        message: string;
        status: string;
    }>;
    stopServer(id: string): Promise<{
        success: boolean;
        message: string;
        status: string;
    }>;
    restartServer(id: string): Promise<{
        success: boolean;
        message: string;
        status: string;
    }>;
    getServerStatus(id: string): Promise<{
        id: string;
        status: string;
        note: string;
    }>;
    getServerLogs(id: string, lines?: number): Promise<{
        id: string;
        logs: never[];
        note: string;
    }>;
    getServerTools(serverId: string): Promise<string[] | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {};
        };
    }[]>;
    executeTool(serverId: string, toolName: string, params: any): Promise<{
        success: boolean;
        result: string;
        timestamp: string;
        serverId: string;
        toolName: string;
    }>;
    getServerResources(serverId: string): Promise<string[]>;
    getResource(serverId: string, resourceUri: string): Promise<{
        serverId: string;
        uri: string;
        content: null;
        note: string;
    }>;
    getServerPrompts(serverId: string): Promise<never[]>;
    executePrompt(serverId: string, promptName: string, args: any): Promise<{
        success: boolean;
        error: string;
        serverId: string;
        promptName: string;
    }>;
    getAllConnections(): Promise<{
        connections: never[];
        note: string;
    }>;
    getConnection(id: string): Promise<{
        id: string;
        status: string;
        note: string;
    }>;
    closeConnection(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getConfig(): Promise<{
        version: string;
        tnfMcpEndpoint: string;
        marketplaceEndpoint: string;
        registryEndpoint: string;
        scopes: string[];
        protocols: string[];
    }>;
    updateConfig(config: any): Promise<{
        success: boolean;
        message: string;
        config: any;
    }>;
}
//# sourceMappingURL=mcp.controller.d.ts.map