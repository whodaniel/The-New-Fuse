/**
 * MCP Server for Resource Registry
 * Exposes resource management capabilities to AI agents via MCP
 */
export declare class ResourceRegistryMCPServer {
    private server;
    private resourceService;
    private accessControl;
    constructor();
    private setupToolHandlers;
    private setupErrorHandling;
    private getTools;
    private searchResources;
    private getResource;
    private createResource;
    private updateResource;
    private listCategories;
    private getResourceVersions;
    start(): Promise<void>;
}
//# sourceMappingURL=resource-registry-mcp-server.d.ts.map