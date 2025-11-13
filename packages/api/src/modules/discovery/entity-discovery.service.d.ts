import { OnModuleInit } from '@nestjs/common';
import { MCPRegistryService } from '../mcp/mcp-registry.service';
export declare class EntityDiscoveryService implements OnModuleInit {
    private readonly mcpRegistryService;
    private readonly logger;
    constructor(mcpRegistryService: MCPRegistryService);
    onModuleInit(): Promise<void>;
    private discoverAndRegisterEntities;
    private registerAIModel;
}
//# sourceMappingURL=entity-discovery.service.d.ts.map