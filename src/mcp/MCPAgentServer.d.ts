import { MCPServer, MCPServerOptions } from './MCPServer.js';
/**
 * Simple Agent Service interface for capability registration
 */
interface AgentServiceInterface {
    registerCapability(capability: unknown): Promise<{
        id: string;
        [key: string]: unknown;
    }>;
}
export declare class MCPAgentServer extends MCPServer {
    private readonly agentService?;
    private apiToolRegistrar;
    private apiValidator;
    constructor(options?: MCPServerOptions, agentService?: AgentServiceInterface | undefined);
    registerNewCapability(capability: any): Promise<{
        success: boolean;
        capabilityId: string;
    }>;
    registerAgentAPI(agentId: string, apiSpec: unknown): Promise<void>;
    routeAgentMessage(_message: unknown): Promise<{
        status: string;
        messageId: string;
    }>;
    discoverAgents(_params: unknown): Promise<unknown[]>;
    broadcastMessage(_msg: unknown): Promise<void>;
    private validateCapability;
    private notifyCapabilityUpdate;
}
export {};
//# sourceMappingURL=MCPAgentServer.d.ts.map