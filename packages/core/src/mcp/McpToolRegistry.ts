import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AgentToolType } from '../../types/src/agent.js';
import { McpTool } from './types.js';

/**
 * Registry for MCP tools
 * Manages tool registration, discovery, and execution
 */
export class McpToolRegistry {
  private tools: Map<string, McpTool> = new Map();
  private logger: Console = console;

  constructor(logger?: Console) {
    if (logger) {
      this.logger = logger;
    }
  }

  /**
   * Register a new tool
   * @param tool The tool to register
   * @returns The registered tool
   */
  registerTool(tool: McpTool): McpTool {
    const toolId = `${tool.name}-${uuidv4()}`;
    
    if (this.tools.has(toolId)) {
      this.logger.warn(`Tool with ID ${toolId} already exists. Overwriting.`);
    }
    
    this.tools.set(toolId, {
      ...tool,
      id: toolId
    } as McpTool);
    
    this.logger.info(`Registered tool: ${tool.name} (${toolId})`);
    return this.tools.get(toolId) as McpTool;
  }

  /**
   * Get all registered tools
   * @returns Array of registered tools
   */
  getAllTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a tool by ID
   * @param toolId The ID of the tool to get
   * @returns The tool, or undefined if not found
   */
  getTool(toolId: string): McpTool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Get tools by type
   * @param type The type of tools to get
   * @returns Array of tools of the specified type
   */
  getToolsByType(type: AgentToolType): McpTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.type === type);
  }

  /**
   * Execute a tool
   * @param toolId The ID of the tool to execute
   * @param params Parameters to pass to the tool
   * @returns The result of the tool execution
   */
  async executeTool(toolId: string, params: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolId);
    
    if (!tool) {
      throw new Error(`Tool with ID ${toolId} not found`);
    }
    
    try {
      // Validate parameters using Zod schema if available
      let validatedParams = params;
      if (tool.parameterSchema) {
        validatedParams = tool.parameterSchema.parse(params);
      }
      
      // Execute the tool
      return await tool.handler(validatedParams);
    } catch (error: any) {
      this.logger.error(`Error executing tool ${tool.name}: ${error.message}`);
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * Register a standard file management tool
   * @param name Tool name
   * @param description Tool description
   * @param handler Tool handler function
   * @returns The registered tool
   */
  registerFileManagementTool(
    name: string,
    description: string,
    handler: (params: Record<string, any>) => Promise<any>
  ): McpTool {
    return this.registerTool({
      name,
      description,
      type: AgentToolType.FILE_MANAGEMENT,
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path',
            required: true
          }
        },
        required: ['path']
      },
      handler
    } as McpTool);
  }

  /**
   * Register a standard process management tool
   * @param name Tool name
   * @param description Tool description
   * @param handler Tool handler function
   * @returns The registered tool
   */
  registerProcessManagementTool(
    name: string,
    description: string,
    handler: (params: Record<string, any>) => Promise<any>
  ): McpTool {
    return this.registerTool({
      name,
      description,
      type: AgentToolType.PROCESS_MANAGEMENT,
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Command to execute',
            required: true
          }
        },
        required: ['command']
      },
      handler
    } as McpTool);
  }

  /**
   * Register a standard web interaction tool
   * @param name Tool name
   * @param description Tool description
   * @param handler Tool handler function
   * @returns The registered tool
   */
  registerWebTool(
    name: string,
    description: string,
    handler: (params: Record<string, any>) => Promise<any>
  ): McpTool {
    return this.registerTool({
      name,
      description,
      type: AgentToolType.WEB_BROWSING,
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to interact with',
            required: true
          }
        },
        required: ['url']
      },
      handler
    } as McpTool);
  }

  /**
   * Register a standard code analysis tool
   * @param name Tool name
   * @param description Tool description
   * @param handler Tool handler function
   * @returns The registered tool
   */
  registerCodeAnalysisTool(
    name: string,
    description: string,
    handler: (params: Record<string, any>) => Promise<any>
  ): McpTool {
    return this.registerTool({
      name,
      description,
      type: AgentToolType.CODEBASE_RETRIEVAL,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Query for code analysis',
            required: true
          }
        },
        required: ['query']
      },
      handler
    } as McpTool);
  }
}
