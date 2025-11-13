import { OnModuleInit } from '@nestjs/common';
import { MCPRegistryService } from './mcp-registry.service';
export declare class MCPRegistryServer implements OnModuleInit {
    private readonly registryService;
    private readonly logger;
    private wss;
    private tools;
    private port;
    private ajv;
    private validatorCache;
    constructor(registryService: MCPRegistryService);
    private compileValidators;
}
//# sourceMappingURL=mcp-registry.server.d.ts.map