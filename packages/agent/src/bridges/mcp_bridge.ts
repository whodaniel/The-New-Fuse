/**
 * MCP Bridge - Model Context Protocol Integration
 *
 * Provides bridge functionality for MCP (Model Context Protocol):
 * - Tool registration and execution
 * - Resource management
 * - Prompt handling
 * - Server lifecycle management
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport abstraction
 * - ProtocolBridge: For A2A protocol integration
 * - TNFMCPModule: For NestJS integration
 */

import { BaseBridge, MessageType, Priority } from './index';

// ============================================================
// MCP TYPES
// ============================================================

export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  };
}

// ============================================================
// MCP BRIDGE CONFIGURATION
// ============================================================

export interface MCPBridgeConfig {
  serverName: string;
  serverVersion: string;
  protocolVersion: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
    logging: boolean;
  };
}

const DEFAULT_CONFIG: MCPBridgeConfig = {
  serverName: 'tnf-mcp-bridge',
  serverVersion: '1.0.0',
  protocolVersion: '2024-11-05',
  capabilities: {
    tools: true,
    resources: true,
    prompts: true,
    logging: true,
  },
};

// ============================================================
// MCP BRIDGE IMPLEMENTATION
// ============================================================

export class MCPBridge extends BaseBridge {
  private config: MCPBridgeConfig;

  // Tool registry
  private tools: Map<string, MCPTool> = new Map();
  private toolHandlers: Map<string, (args: Record<string, unknown>) => Promise<MCPToolResult>> =
    new Map();

  // Resource registry
  private resources: Map<string, MCPResource> = new Map();
  private resourceHandlers: Map<string, () => Promise<MCPResourceContent>> = new Map();

  // Prompt registry
  private prompts: Map<string, MCPPrompt> = new Map();
  private promptHandlers: Map<
    string,
    (args: Record<string, unknown>) => Promise<MCPPromptMessage[]>
  > = new Map();

  constructor(config: Partial<MCPBridgeConfig> = {}) {
    super('mcp-bridge');
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registerBuiltInTools();
  }

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================

  async connect(): Promise<void> {
    this.emit('connecting');

    // Initialize MCP server capabilities
    this.emit('server:info', this.getServerInfo());

    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.emit('disconnected');
  }

  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.REQUEST,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    // Route based on message type
    if (message.method === 'tools/call') {
      const result = await this.callTool(message.params as MCPToolCall);
      this.emit('tool:result', result);
    } else if (message.method === 'resources/read') {
      const content = await this.readResource(message.params as { uri: string });
      this.emit('resource:content', content);
    } else if (message.method === 'prompts/get') {
      const messages = await this.getPrompt(
        message.params as { name: string; arguments?: Record<string, unknown> }
      );
      this.emit('prompt:messages', messages);
    }
  }

  // ============================================================
  // SERVER INFO
  // ============================================================

  getServerInfo(): MCPServerInfo {
    return {
      name: this.config.serverName,
      version: this.config.serverVersion,
      protocolVersion: this.config.protocolVersion,
      capabilities: this.config.capabilities,
    };
  }

  // ============================================================
  // TOOL MANAGEMENT
  // ============================================================

  /**
   * Register a tool
   */
  registerTool(
    tool: MCPTool,
    handler: (args: Record<string, unknown>) => Promise<MCPToolResult>
  ): void {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
    this.emit('tool:registered', tool);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
    this.toolHandlers.delete(name);
    this.emit('tool:unregistered', { name });
  }

  /**
   * List all tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Call a tool
   */
  async callTool(call: MCPToolCall): Promise<MCPToolResult> {
    const handler = this.toolHandlers.get(call.name);

    if (!handler) {
      return {
        content: [{ type: 'text', text: `Tool not found: ${call.name}` }],
        isError: true,
      };
    }

    try {
      this.emit('tool:calling', call);
      const result = await handler(call.arguments);
      this.emit('tool:called', { call, result });
      return result;
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Tool error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // ============================================================
  // RESOURCE MANAGEMENT
  // ============================================================

  /**
   * Register a resource
   */
  registerResource(resource: MCPResource, handler: () => Promise<MCPResourceContent>): void {
    this.resources.set(resource.uri, resource);
    this.resourceHandlers.set(resource.uri, handler);
    this.emit('resource:registered', resource);
  }

  /**
   * Unregister a resource
   */
  unregisterResource(uri: string): void {
    this.resources.delete(uri);
    this.resourceHandlers.delete(uri);
    this.emit('resource:unregistered', { uri });
  }

  /**
   * List all resources
   */
  listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Read a resource
   */
  async readResource(params: { uri: string }): Promise<MCPResourceContent> {
    const handler = this.resourceHandlers.get(params.uri);

    if (!handler) {
      throw new Error(`Resource not found: ${params.uri}`);
    }

    this.emit('resource:reading', params);
    const content = await handler();
    this.emit('resource:read', { uri: params.uri, content });
    return content;
  }

  // ============================================================
  // PROMPT MANAGEMENT
  // ============================================================

  /**
   * Register a prompt
   */
  registerPrompt(
    prompt: MCPPrompt,
    handler: (args: Record<string, unknown>) => Promise<MCPPromptMessage[]>
  ): void {
    this.prompts.set(prompt.name, prompt);
    this.promptHandlers.set(prompt.name, handler);
    this.emit('prompt:registered', prompt);
  }

  /**
   * Unregister a prompt
   */
  unregisterPrompt(name: string): void {
    this.prompts.delete(name);
    this.promptHandlers.delete(name);
    this.emit('prompt:unregistered', { name });
  }

  /**
   * List all prompts
   */
  listPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Get a prompt
   */
  async getPrompt(params: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<MCPPromptMessage[]> {
    const handler = this.promptHandlers.get(params.name);

    if (!handler) {
      throw new Error(`Prompt not found: ${params.name}`);
    }

    this.emit('prompt:getting', params);
    const messages = await handler(params.arguments || {});
    this.emit('prompt:got', { name: params.name, messages });
    return messages;
  }

  // ============================================================
  // BUILT-IN TOOLS
  // ============================================================

  private registerBuiltInTools(): void {
    // System info tool
    this.registerTool(
      {
        name: 'tnf_system_info',
        description: 'Get information about the TNF autonomous system',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                server: this.getServerInfo(),
                tools: this.tools.size,
                resources: this.resources.size,
                prompts: this.prompts.size,
                connected: this.isConnected,
              },
              null,
              2
            ),
          },
        ],
      })
    );

    // List tools tool
    this.registerTool(
      {
        name: 'tnf_list_tools',
        description: 'List all available tools',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(this.listTools(), null, 2),
          },
        ],
      })
    );

    // Agent status tool
    this.registerTool(
      {
        name: 'tnf_agent_status',
        description: 'Get the status of registered agents',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Optional specific agent ID',
            },
          },
        },
      },
      async (args) => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                agentId: args.agentId || 'all',
                status: 'operational',
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      })
    );

    // Execute BMAD cycle tool
    this.registerTool(
      {
        name: 'tnf_bmad_cycle',
        description: 'Execute a BMAD (Skills→Tools→Context→Prompts) cycle',
        inputSchema: {
          type: 'object',
          properties: {
            purpose: {
              type: 'string',
              description: 'The purpose of this BMAD cycle',
            },
            skillIds: {
              type: 'string',
              description: 'Comma-separated list of skill IDs to use',
            },
          },
          required: ['purpose'],
        },
      },
      async (args) => {
        const purpose = args.purpose as string;
        const skillIds = args.skillIds ? (args.skillIds as string).split(',') : [];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  purpose,
                  skillIds,
                  status: 'cycle_initiated',
                  message: 'BMAD cycle queued for execution',
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  getStatistics(): {
    connected: boolean;
    tools: number;
    resources: number;
    prompts: number;
    serverInfo: MCPServerInfo;
  } {
    return {
      connected: this.isConnected,
      tools: this.tools.size,
      resources: this.resources.size,
      prompts: this.prompts.size,
      serverInfo: this.getServerInfo(),
    };
  }
}

export default MCPBridge;
