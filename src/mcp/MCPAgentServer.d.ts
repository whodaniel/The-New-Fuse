import { z } from 'zod';
import { MCPServer } from './MCPServer.tsx';
import { AgentService } from '../agents/agent.service.js';
declare const agentCapabilitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    returns: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    name?: string;
    description?: string;
    parameters?: Record<string, unknown>;
    version?: string;
    returns?: Record<string, unknown>;
}, {
    id?: string;
    name?: string;
    description?: string;
    parameters?: Record<string, unknown>;
    version?: string;
    returns?: Record<string, unknown>;
}>;
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