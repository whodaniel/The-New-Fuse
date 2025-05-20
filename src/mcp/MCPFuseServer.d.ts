import { MCPServer, MCPServerOptions } from './MCPServer.js';
import { MCPAgentServer } from './MCPAgentServer.js';
import { MCPChatServer } from './MCPChatServer.js';
import { MCPWorkflowServer } from './MCPWorkflowServer.js';
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
