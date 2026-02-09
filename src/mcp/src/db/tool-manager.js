"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const prisma_client_1 = require("./prisma-client");
const logger_1 = require("./logger");
/**
 * ToolManager handles database operations for tools and tool executions
 */
class ToolManager {
    /**
     * Register a new tool
     * @param name Tool name
     * @param description Tool description
     * @param parameters Tool parameters schema
     * @param capability Tool capability category
     * @returns The created tool
     */
    async registerTool(name, description, parameters, capability) {
        try {
            // Check if tool already exists
            const existingTool = await prisma_client_1.prisma.tool.findUnique({
                where: { name }
            });
            if (existingTool) {
                // Update existing tool
                const updatedTool = await prisma_client_1.prisma.tool.update({
                    where: { id: existingTool.id },
                    data: {
                        description,
                        parameters,
                        capability,
                        isDeprecated: false,
                        updatedAt: new Date()
                    }
                });
                logger_1.logger.info(`Updated existing tool: ${name}`);
                return updatedTool;
            }
            // Create new tool
            const tool = await prisma_client_1.prisma.tool.create({
                data: {
                    name,
                    description,
                    parameters,
                    capability
                }
            });
            logger_1.logger.info(`Registered new tool: ${name}`);
            return tool;
        }
        catch (error) {
            logger_1.logger.error(`Error registering tool: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get tool by ID
     * @param toolId The tool ID
     * @returns Tool details
     */
    async getToolById(toolId) {
        try {
            const tool = await prisma_client_1.prisma.tool.findUnique({
                where: { id: toolId }
            });
            if (!tool) {
                throw new Error(`Tool with ID ${toolId} not found`);
            }
            return tool;
        }
        catch (error) {
            logger_1.logger.error(`Error getting tool: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get tool by name
     * @param name Tool name
     * @returns Tool details
     */
    async getToolByName(name) {
        try {
            const tool = await prisma_client_1.prisma.tool.findUnique({
                where: { name }
            });
            if (!tool) {
                throw new Error(`Tool with name '${name}' not found`);
            }
            return tool;
        }
        catch (error) {
            logger_1.logger.error(`Error getting tool: ${error.message}`);
            throw error;
        }
    }
    /**
     * List all tools, optionally filtering by capability
     * @param capability Optional capability to filter by
     * @param includeDeprecated Whether to include deprecated tools
     * @returns Array of tools
     */
    async listTools(capability, includeDeprecated = false) {
        try {
            const filter = {};
            if (!includeDeprecated) {
                filter.isDeprecated = false;
            }
            if (capability) {
                filter.capability = capability;
            }
            const tools = await prisma_client_1.prisma.tool.findMany({
                where: filter,
                orderBy: { name: 'asc' }
            });
            logger_1.logger.info(`Retrieved ${tools.length} tools`);
            return tools;
        }
        catch (error) {
            logger_1.logger.error(`Error listing tools: ${error.message}`);
            throw error;
        }
    }
    /**
     * Deprecate a tool
     * @param toolId The tool ID to deprecate
     */
    async deprecateTool(toolId) {
        try {
            await prisma_client_1.prisma.tool.update({
                where: { id: toolId },
                data: { isDeprecated: true }
            });
            logger_1.logger.info(`Deprecated tool ${toolId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deprecating tool: ${error.message}`);
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
    async recordToolCall(messageId, toolId, parameters) {
        try {
            const toolCall = await prisma_client_1.prisma.toolCall.create({
                data: {
                    messageId,
                    toolId,
                    parameters,
                    status: 'pending'
                }
            });
            logger_1.logger.info(`Recorded tool call: ${toolCall.id}`);
            return toolCall;
        }
        catch (error) {
            logger_1.logger.error(`Error recording tool call: ${error.message}`);
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
    async recordToolExecution(toolCallId, agentId, result, error) {
        try {
            // Get the tool call to retrieve the tool ID and parameters
            const toolCall = await prisma_client_1.prisma.toolCall.findUnique({
                where: { id: toolCallId },
                include: { tool: true }
            });
            if (!toolCall) {
                throw new Error(`Tool call with ID ${toolCallId} not found`);
            }
            // Update the tool call status
            await prisma_client_1.prisma.toolCall.update({
                where: { id: toolCallId },
                data: { status: error ? 'error' : 'success' }
            });
            // Record the execution
            const execution = await prisma_client_1.prisma.toolExecution.create({
                data: {
                    toolCallId,
                    toolId: toolCall.toolId,
                    agentId,
                    parameters: toolCall.parameters,
                    result,
                    error,
                    endTime: new Date()
                },
                include: {
                    toolCall: true,
                    tool: true
                }
            });
            logger_1.logger.info(`Recorded tool execution: ${execution.id}`);
            return execution;
        }
        catch (error) {
            logger_1.logger.error(`Error recording tool execution: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get recent tool executions for an agent
     * @param agentId Agent ID
     * @param limit Number of executions to retrieve
     * @returns Array of tool executions
     */
    async getRecentExecutions(agentId, limit = 10) {
        try {
            const executions = await prisma_client_1.prisma.toolExecution.findMany({
                where: { agentId },
                include: {
                    tool: true,
                    toolCall: true
                },
                orderBy: { startTime: 'desc' },
                take: limit
            });
            logger_1.logger.info(`Retrieved ${executions.length} recent tool executions for agent ${agentId}`);
            return executions;
        }
        catch (error) {
            logger_1.logger.error(`Error getting recent executions: ${error.message}`);
            throw error;
        }
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=tool-manager.js.map