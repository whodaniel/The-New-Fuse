import { z } from 'zod';
import { MCPServer } from './MCPServer';
import { AgentService } from '../agents/agent.service';
declare const agentCapabilitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
    returns: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
}, z.core.$strip>;
export declare class MCPAgentServer extends MCPServer {
    private readonly agentService;
    private apiToolRegistrar;
    private apiValidator;
    constructor(agentService: AgentService, options?: MCPServerOptions);
    registerNewCapability(capability: z.infer<typeof agentCapabilitySchema>): Promise<{
        success: boolean;
        capabilityId: string;
    }>;
    private validateCapability;
    private notifyCapabilityUpdate;
}
export {};
//# sourceMappingURL=MCPAgentServer.d.ts.map