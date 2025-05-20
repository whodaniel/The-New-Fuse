import { getLogger, ExtensionLogger } from '../../core/logging.js';
import { MCPError, ErrorCode } from '../../core/error-handling.js';

export interface MCPTool {
    id: string;
    name: string;
    description: string;
    version: string;
    capabilities: string[];
    execute: (args: any) => Promise<any>;
}

export class ToolRegistry {
    private tools: Map<string, MCPTool> = new Map();
    private readonly logger: ExtensionLogger;

    constructor() {
        this.logger = getLogger();
    }

    async registerTool(tool: MCPTool): Promise<void> {
        if (this.tools.has(tool.id)) {
            throw new MCPError(
                ErrorCode.TOOL_EXECUTION_FAILED,
                `Tool with ID ${tool.id} already registered`
            );
        }

        this.tools.set(tool.id, tool);
        this.logger.info(`Registered tool: ${tool.name} (${tool.id})`);
    }

    async executeTool(toolId: string, args: any): Promise<any> {
        const tool = this.tools.get(toolId);
        if (!tool) {
            throw new MCPError(
                ErrorCode.TOOL_EXECUTION_FAILED,
                `Tool ${toolId} not found`
            );
        }

        try {
            return await tool.execute(args);
        } catch (error) {
            throw new MCPError(
                ErrorCode.TOOL_EXECUTION_FAILED,
                `Failed to execute tool ${toolId}`,
                error
            );
        }
    }

    getTools(): MCPTool[] {
        return Array.from(this.tools.values());
    }
}
