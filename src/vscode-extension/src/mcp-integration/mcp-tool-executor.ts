 import { MCPManagerImpl as MCPManager } from './mcp-manager.js'; // Import MCPManagerImpl and alias
 import { MCPTool } from '../types/mcp.js';
import { getLogger, Logger } from '../core/logging.js';
import { getErrorMessage } from '../utils/error-utils.js';

/**
 * MCPToolExecutor facilitates running MCP tools as part of LLM workflows
 * This implementation is inspired by how Copilot handles tool execution
 */
export class MCPToolExecutor {
  private mcpManager: MCPManager;
  private logger: Logger;

  constructor(mcpManager: MCPManager) {
    this.mcpManager = mcpManager;
    this.logger = getLogger();
  }

  /**
   * Execute a tool by name with the given parameters
   */
  public async executeTool(
    toolName: string,
    params: Record<string, any>,
    serverId?: string
  ): Promise<any> {
    try {
      this.logger.debug(`Executing tool: ${toolName} with params: ${JSON.stringify(params)}`);

      // Fix parameter order to match MCPManager.executeTool
      const result = await this.mcpManager.executeTool(
        serverId || '',  // First parameter: serverId
        toolName,        // Second parameter: toolName
        params           // Third parameter: params
      );

      this.logger.debug(`Tool execution result: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute tool ${toolName}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Get all available tools from the active server
   */
  public async getAvailableTools(serverId?: string): Promise<MCPTool[]> {
    try {
      return await this.mcpManager.getTools(serverId);
    } catch (error) {
      this.logger.error(`Failed to get available tools: ${getErrorMessage(error)}`);
      return [];
    }
  }

  /**
   * Convert tools to a schema that LLMs can understand (JSON Schema format)
   * This is similar to how Copilot formats tools for its LLMs
   */
  public convertToolsToJSONSchema(tools: MCPTool[]): any[] {
    return tools.map(tool => {
      const schema: any = {
        name: tool.name,
        description: tool.description || `Execute the ${tool.name} tool`,
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      };

      // Add parameters
      if (tool.parameters && tool.parameters.length > 0) {
        for (const param of tool.parameters) {
          schema.parameters.properties[param.name] = {
            type: param.type,
            description: param.description || `Parameter: ${param.name}`
          };

          // Add enum if available
          if (param.enum) {
            schema.parameters.properties[param.name].enum = param.enum;
          }

          // Add default if available
          if (param.default !== undefined) {
            schema.parameters.properties[param.name].default = param.default;
          }

          // Handle array type
          if (param.type === 'array' && param.items) {
            schema.parameters.properties[param.name].items = param.items;
          }

          // Add to required list if needed
          if (param.required) {
            schema.parameters.required.push(param.name);
          }
        }
      }

      return schema;
    });
  }

  /**
   * Generate LLM prompt for tool usage
   * This function creates a prompt that instructs the LLM on how to use available tools
   */
  public generateToolUsagePrompt(tools: MCPTool[]): string {
    if (tools.length === 0) {
      return '';
    }

    let prompt = 'You have access to the following tools:\n\n';

    for (const tool of tools) {
      prompt += `## ${tool.name}\n`;
      prompt += `${tool.description || ''}\n\n`;

      if (tool.parameters && tool.parameters.length > 0) {
        prompt += 'Parameters:\n';

        for (const param of tool.parameters) {
          prompt += `- ${param.name} (${param.type})${param.required ? ' (Required)' : ''}: ${param.description || ''}\n`;

          if (param.enum) {
            prompt += `  Allowed values: ${param.enum.join(', ')}\n`;
          }

          if (param.default !== undefined) {
            prompt += `  Default: ${param.default}\n`;
          }
        }

        prompt += '\n';
      }
    }

    prompt += `
To use a tool, respond with a JSON object in the following format:
\`\`\`json
{
  "tool": "tool_name",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

If you need to use multiple tools, respond with each tool call separately.
`;

    return prompt;
  }

  /**
   * Handle Tool Call from LLM
   * This function executes a tool based on LLM's tool call and returns a response
   * that can be fed back to the LLM
   */
  public async handleToolCall(toolCall: any): Promise<any> {
    try {
      if (!toolCall.tool || typeof toolCall.tool !== 'string') {
        throw new Error('Invalid tool call: Missing tool name');
      }

      const toolName = toolCall.tool;
      const params = toolCall.parameters || {};

      // Execute the tool
      const result = await this.executeTool(toolName, params);

      return {
        tool: toolName,
        result
      };
    } catch (error) {
      return {
        tool: toolCall.tool || 'unknown',
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Extract Tool Calls from LLM response
   * This function parses an LLM response to extract tool calls
   */
  public extractToolCalls(llmResponse: string): any[] {
    const toolCalls: any[] = [];

    // Look for JSON blocks
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
    let match;

    while ((match = jsonRegex.exec(llmResponse)) !== null) {
      try {
        const jsonStr = match[1];
        const toolCall = JSON.parse(jsonStr);

        if (toolCall.tool && (toolCall.parameters || toolCall.params)) {
          // Normalize parameters
          if (toolCall.params && !toolCall.parameters) {
            toolCall.parameters = toolCall.params;
            delete toolCall.params;
          }

          toolCalls.push(toolCall);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse tool call: ${getErrorMessage(error)}`);
      }
    }

    return toolCalls;
  }
}
