import { z } from 'zod';
/**
 * Schema for an MCP marketplace server
 */
declare const mcpMarketplaceServerSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodString;
    publisher: z.ZodString;
    category: z.ZodString;
    rating: z.ZodNumber;
    downloads: z.ZodNumber;
    lastUpdated: z.ZodString;
    installCommand: z.ZodString;
    args: z.ZodArray<z.ZodString>;
    capabilities: z.ZodArray<z.ZodString>;
    requiresConfiguration: z.ZodBoolean;
    configurationSchema: z.ZodOptional<z.ZodObject<{
        type: z.ZodString;
        required: z.ZodOptional<z.ZodArray<z.ZodString>>;
        properties: z.ZodRecord<z.ZodAny, z.core.SomeType>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type MCPMarketplaceServer = z.infer<typeof mcpMarketplaceServerSchema>;
/**
 * Service for interacting with the MCP marketplace
 */
export declare class MCPMarketplaceService {
    private apiBaseUrl;
    private cacheExpiryMs;
    private cachedServers;
    constructor();
    /**
     * Fetches all MCP servers from the marketplace
     * @returns A list of marketplace MCP servers
     */
    getServers(): Promise<MCPMarketplaceServer[]>;
    /**
     * Searches for MCP servers in the marketplace
     * @param query The search query
     * @returns A list of matching marketplace MCP servers
     */
    searchServers(query: string): Promise<MCPMarketplaceServer[]>;
    /**
     * Fetches a specific MCP server from the marketplace
     * @param id The server ID
     * @returns The marketplace MCP server
     */
    getServer(id: string): Promise<MCPMarketplaceServer | null>;
    /**
     * Installs an MCP server from the marketplace
     * @param id The server ID
     * @param config Optional configuration parameters
     * @returns True if successful
     */
    installServer(id: string, config?: Record<string, any>): Promise<boolean>;
    /**
     * Gets mock servers for development
     * @returns A list of mock marketplace MCP servers
     */
    private getMockServers;
}
export {};
