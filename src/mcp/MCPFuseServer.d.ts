import { MCPServer, MCPServerOptions } from './MCPServer.tsx';
import { MCPAgentServer } from './MCPAgentServer.tsx';
import { MCPChatServer } from './MCPChatServer.tsx';
import { MCPWorkflowServer } from './MCPWorkflowServer.tsx';
export declare class MCPFuseServer extends MCPServer {
  private readonly agentServer;
  private readonly chatServer;
  private readonly workflowServer;
  protected readonly logger: unknown;
  constructor(
    agentServer: MCPAgentServer,
    chatServer: MCPChatServer,
    workflowServer: MCPWorkflowServer,
    options?: MCPServerOptions,
  );
  /**
   * Wraps tools from a server with proper execute functions
   */
  private wrapServerTools;
}
