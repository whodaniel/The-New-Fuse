import { db, zodSchemaToJson, jsonToZodSchema } from './db-client.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * ToolManager handles database operations for tools and tool executions
 */
export class ToolManager {
  /**
   * Register a new tool
   * @param name Tool name
   * @param description Tool description
   * @param parameters Tool parameters schema
   * @param capability Tool capability category
   * @returns The created tool
   */
  async registerTool(
    name: string,
    description: string,
    parameters: any,
    capability?: string
  ): Promise<any> {
    try {
      const existingTool = await db.tool.findUnique({ where: { name } });

      if (existingTool) {
        const updatedTool = await db.tool.update({
          where: { id: existingTool.id },
          data: {
            description,
            parameters,
            capability,
            isDeprecated: false,
            updatedAt: new Date(),
          },
        });

        logger.info(`Updated existing tool: ${name}`);
        return updatedTool;
      }

      const tool = await db.tool.create({
        data: {
          id: uuidv4(),
          name,
          description,
          parameters,
          capability,
          isDeprecated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`Registered new tool: ${name}`);
      return tool;
    } catch (error: any) {
      logger.error(`Error registering tool: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tool by ID
   * @param toolId The tool ID
   * @returns Tool details
   */
  async getToolById(toolId: string): Promise<any> {
    try {
      const tool = await db.tool.findUnique({ where: { id: toolId } });

      if (!tool) {
        throw new Error(`Tool with ID ${toolId} not found`);
      }

      return tool;
    } catch (error: any) {
      logger.error(`Error getting tool: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tool by name
   * @param name Tool name
   * @returns Tool details
   */
  async getToolByName(name: string): Promise<any> {
    try {
      const tool = await db.tool.findUnique({ where: { name } });

      if (!tool) {
        throw new Error(`Tool with name '${name}' not found`);
      }

      return tool;
    } catch (error: any) {
      logger.error(`Error getting tool: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all tools, optionally filtering by capability
   * @param capability Optional capability to filter by
   * @param includeDeprecated Whether to include deprecated tools
   * @returns Array of tools
   */
  async listTools(capability?: string, includeDeprecated = false): Promise<any[]> {
    try {
      const filter: any = {};

      if (!includeDeprecated) {
        filter.isDeprecated = false;
      }

      if (capability) {
        filter.capability = capability;
      }

      const tools = await db.tool.findMany({
        where: filter,
        orderBy: { name: 'asc' },
      });

      logger.info(`Retrieved ${tools.length} tools`);
      return tools;
    } catch (error: any) {
      logger.error(`Error listing tools: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deprecate a tool
   * @param toolId The tool ID to deprecate
   */
  async deprecateTool(toolId: string): Promise<void> {
    try {
      await db.tool.update({
        where: { id: toolId },
        data: { isDeprecated: true, updatedAt: new Date() },
      });

      logger.info(`Deprecated tool ${toolId}`);
    } catch (error: any) {
      logger.error(`Error deprecating tool: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record a tool call
   * @param messageId Message ID that contains the tool call
   * @param toolId Tool ID
   * @param parameters Tool parameters
   * @returns The created tool call record
   */
  async recordToolCall(
    messageId: string,
    toolId: string,
    parameters: any
  ): Promise<any> {
    try {
      const toolCall = await db.toolCall.create({
        data: {
          id: uuidv4(),
          messageId,
          toolId,
          parameters,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`Recorded tool call: ${toolCall.id}`);
      return toolCall;
    } catch (error: any) {
      logger.error(`Error recording tool call: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record a tool execution
   * @param toolCallId Tool call ID
   * @param agentId Agent ID executing the tool
   * @param result Tool execution result
   * @param error Optional error message
   * @returns The tool execution record
   */
  async recordToolExecution(
    toolCallId: string,
    agentId: string,
    result?: any,
    error?: string
  ): Promise<any> {
    try {
      const toolCall = await db.toolCall.findUnique({ where: { id: toolCallId } });

      if (!toolCall) {
        throw new Error(`Tool call with ID ${toolCallId} not found`);
      }

      await db.toolCall.update({
        where: { id: toolCallId },
        data: { status: error ? 'error' : 'success', updatedAt: new Date() },
      });

      const execution = await db.toolExecution.create({
        data: {
          id: uuidv4(),
          toolCallId,
          toolId: toolCall.toolId,
          agentId,
          parameters: toolCall.parameters,
          result,
          error,
          startTime: new Date(),
          endTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const tool = await db.tool.findUnique({ where: { id: toolCall.toolId } });

      logger.info(`Recorded tool execution: ${execution.id}`);
      return {
        ...execution,
        toolCall,
        tool,
      };
    } catch (error: any) {
      logger.error(`Error recording tool execution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recent tool executions for an agent
   * @param agentId Agent ID
   * @param limit Number of executions to retrieve
   * @returns Array of tool executions
   */
  async getRecentExecutions(agentId: string, limit = 10): Promise<any[]> {
    try {
      const executions = await db.toolExecution.findMany({
        where: { agentId },
        orderBy: { startTime: 'desc' },
        take: limit,
      });

      const tools = await db.tool.findMany();
      const toolCalls = await db.toolCall.findMany();
      const toolsById = new Map(tools.map((t) => [t.id, t]));
      const toolCallsById = new Map(toolCalls.map((t) => [t.id, t]));

      const enriched = executions.map((exec) => ({
        ...exec,
        tool: toolsById.get(exec.toolId) ?? null,
        toolCall: toolCallsById.get(exec.toolCallId) ?? null,
      }));

      logger.info(`Retrieved ${enriched.length} recent tool executions for agent ${agentId}`);
      return enriched;
    } catch (error: any) {
      logger.error(`Error getting recent executions: ${error.message}`);
      throw error;
    }
  }
}
