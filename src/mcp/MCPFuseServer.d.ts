import { MCPAgentServer, MCPChatServer, MCPWorkflowServer } from './servers';
import { MCPServerOptions, MCPToolParams } from './types';
import { MCPFileCoordinationServer } from './MCPFileCoordinationServer';
export declare class MCPFuseServer {
    private readonly agentServer;
    private readonly chatServer;
    private readonly workflowServer;
    private readonly fileCoordinationServer;
    private readonly options;
    protected readonly logger: any;
    constructor(agentServer: MCPAgentServer, chatServer: MCPChatServer, workflowServer: MCPWorkflowServer, fileCoordinationServer: MCPFileCoordinationServer, options?: MCPServerOptions);
    getTools(): Record<string, MCPToolParams>;
    private wrapServerTools;
}
//# sourceMappingURL=MCPFuseServer.d.ts.map