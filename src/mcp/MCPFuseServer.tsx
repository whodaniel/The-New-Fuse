import { Logger } from "@/utils/logger";
import { MCPAgentServer, MCPChatServer, MCPWorkflowServer } from './servers.js';
import { MCPServerOptions, MCPToolParams, MCPServer } from './types.js';

export class MCPFuseServer {
  protected readonly logger = new Logger(MCPFuseServer.name);

  constructor(
    private readonly agentServer: MCPAgentServer,
    private readonly chatServer: MCPChatServer,
    private readonly workflowServer: MCPWorkflowServer,
    private readonly options: MCPServerOptions = {},
  ) {}

  getTools(): Record<string, MCPToolParams> {
    return {
      ...this.wrapServerTools(this.agentServer, "agentServer"),
      ...this.wrapServerTools(this.chatServer, "chatServer"),
      ...this.wrapServerTools(this.workflowServer, "workflowServer"),
    };
  }

  private wrapServerTools(
    server: MCPServer,
    prefix: string,
  ): Record<string, MCPToolParams> {
    return Object.entries(server.getTools()).reduce(
      (tools, [name, tool]) => ({
        ...tools,
        [`${prefix}.${name}`]: {
          ...tool,
          execute: async (...args: unknown[]) => {
            try {
              return await (this as any)[prefix][name](...args);
            } catch (error) {
              this.logger.error(`Error executing ${prefix}.${name}:`, error);
              throw error;
            }
          },
        },
      }),
      {} as Record<string, MCPToolParams>,
    );
  }
}
