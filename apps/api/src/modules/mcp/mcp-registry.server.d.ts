import { MCPRegistryService } from './mcp-registry.service';
export declare class MCPRegistryServer {
    private readonly registryService;
    private readonly logger;
    constructor(registryService: MCPRegistryService);
    handleMessage(message: string): Promise<string>;
    private processMessage;
    private getAvailableTools;
}
//# sourceMappingURL=mcp-registry.server.d.ts.map