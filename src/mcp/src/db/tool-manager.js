"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const db_client_1 = require("./db-client");
const uuid_1 = require("uuid");
const logger_1 = require("./logger");

/**
 * ToolManager handles database operations for tools and tool executions
 */
class ToolManager {
  async registerTool(name, description, parameters, capability) {
    try {
      const existingTool = await db_client_1.db.tool.findUnique({ where: { name } });
      if (existingTool) {
        const updatedTool = await db_client_1.db.tool.update({
          where: { id: existingTool.id },
          data: {
            description,
            parameters,
            capability,
            isDeprecated: false,
            updatedAt: new Date(),
          },
        });
        logger_1.logger.info(`Updated existing tool: ${name}`);
        return updatedTool;
      }
      const tool = await db_client_1.db.tool.create({
        data: {
          id: (0, uuid_1.v4)(),
          name,
          description,
          parameters,
          capability,
          isDeprecated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      logger_1.logger.info(`Registered new tool: ${name}`);
      return tool;
    } catch (error) {
      logger_1.logger.error(`Error registering tool: ${error.message}`);
      throw error;
    }
  }

  async getToolById(toolId) {
    try {
      const tool = await db_client_1.db.tool.findUnique({ where: { id: toolId } });
      if (!tool) {
        throw new Error(`Tool with ID ${toolId} not found`);
      }
      return tool;
    } catch (error) {
      logger_1.logger.error(`Error getting tool: ${error.message}`);
      throw error;
    }
  }

  async getToolByName(name) {
    try {
      const tool = await db_client_1.db.tool.findUnique({ where: { name } });
      if (!tool) {
        throw new Error(`Tool with name '${name}' not found`);
      }
      return tool;
    } catch (error) {
      logger_1.logger.error(`Error getting tool: ${error.message}`);
      throw error;
    }
  }

  async listTools(capability, includeDeprecated = false) {
    try {
      const filter = {};
      if (!includeDeprecated) {
        filter.isDeprecated = false;
      }
      if (capability) {
        filter.capability = capability;
      }
      const tools = await db_client_1.db.tool.findMany({
        where: filter,
        orderBy: { name: 'asc' },
      });
      logger_1.logger.info(`Retrieved ${tools.length} tools`);
      return tools;
    } catch (error) {
      logger_1.logger.error(`Error listing tools: ${error.message}`);
      throw error;
    }
  }

  async deprecateTool(toolId) {
    try {
      await db_client_1.db.tool.update({
        where: { id: toolId },
        data: { isDeprecated: true, updatedAt: new Date() },
      });
      logger_1.logger.info(`Deprecated tool ${toolId}`);
    } catch (error) {
      logger_1.logger.error(`Error deprecating tool: ${error.message}`);
      throw error;
    }
  }

  async recordToolCall(messageId, toolId, parameters) {
    try {
      const toolCall = await db_client_1.db.toolCall.create({
        data: {
          id: (0, uuid_1.v4)(),
          messageId,
          toolId,
          parameters,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      logger_1.logger.info(`Recorded tool call: ${toolCall.id}`);
      return toolCall;
    } catch (error) {
      logger_1.logger.error(`Error recording tool call: ${error.message}`);
      throw error;
    }
  }

  async recordToolExecution(toolCallId, agentId, result, error) {
    try {
      const toolCall = await db_client_1.db.toolCall.findUnique({ where: { id: toolCallId } });
      if (!toolCall) {
        throw new Error(`Tool call with ID ${toolCallId} not found`);
      }
      await db_client_1.db.toolCall.update({
        where: { id: toolCallId },
        data: { status: error ? 'error' : 'success', updatedAt: new Date() },
      });
      const execution = await db_client_1.db.toolExecution.create({
        data: {
          id: (0, uuid_1.v4)(),
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
      const tool = await db_client_1.db.tool.findUnique({ where: { id: toolCall.toolId } });
      logger_1.logger.info(`Recorded tool execution: ${execution.id}`);
      return { ...execution, toolCall, tool };
    } catch (error) {
      logger_1.logger.error(`Error recording tool execution: ${error.message}`);
      throw error;
    }
  }

  async getRecentExecutions(agentId, limit = 10) {
    try {
      const executions = await db_client_1.db.toolExecution.findMany({
        where: { agentId },
        orderBy: { startTime: 'desc' },
        take: limit,
      });
      const tools = await db_client_1.db.tool.findMany();
      const toolCalls = await db_client_1.db.toolCall.findMany();
      const toolsById = new Map(tools.map((t) => [t.id, t]));
      const toolCallsById = new Map(toolCalls.map((t) => [t.id, t]));
      const enriched = executions.map((exec) => ({
        ...exec,
        tool: toolsById.get(exec.toolId) ?? null,
        toolCall: toolCallsById.get(exec.toolCallId) ?? null,
      }));
      logger_1.logger.info(`Retrieved ${enriched.length} recent tool executions for agent ${agentId}`);
      return enriched;
    } catch (error) {
      logger_1.logger.error(`Error getting recent executions: ${error.message}`);
      throw error;
    }
  }
}
exports.ToolManager = ToolManager;
