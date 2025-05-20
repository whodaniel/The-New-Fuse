import { MCPAgentServer } from './MCPAgentServer.js';
import { MCPChatServer } from './MCPChatServer.js';
import { MCPWorkflowServer } from './MCPWorkflowServer.js';
import { MCPFuseServer } from './MCPFuseServer.js';
interface ExecuteCapabilityDto {
  params: Record<string, any>;
}
interface ExecuteToolDto {
  params: Record<string, any>;
}
/**
 * Controller that exposes MCP server capabilities via REST API
 */
export declare class MCPController {
  private readonly agentServer;
  private readonly chatServer;
  private readonly workflowServer;
  private readonly fuseServer;
  constructor(
    agentServer: MCPAgentServer,
    chatServer: MCPChatServer,
    workflowServer: MCPWorkflowServer,
    fuseServer: MCPFuseServer,
  );
  getAgentCapabilities(): Record<
    string,
    Omit<import("./MCPServer").MCPCapabilityParams, "execute">
  >;
  executeAgentCapability(
    name: string,
    dto: ExecuteCapabilityDto,
  ): Promise<unknown>;
  getChatTools(): Record<
    string,
    Omit<import("./MCPServer").MCPToolParams, "execute">
  >;
  executeChatTool(name: string, dto: ExecuteToolDto): Promise<unknown>;
  getWorkflowTools(): Record<
    string,
    Omit<import("./MCPServer").MCPToolParams, "execute">
  >;
  executeWorkflowTool(name: string, dto: ExecuteToolDto): Promise<unknown>;
  getFuseTools(): Record<
    string,
    Omit<import("./MCPServer").MCPToolParams, "execute">
  >;
  executeFuseTool(name: string, dto: ExecuteToolDto): Promise<unknown>;
}
export {};
