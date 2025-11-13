/**
 * Abstract base class for MCP Tool Handlers
 */
import { ToolHandler as IToolHandler, ToolResult, ValidationResult, ToolUsageStats, JSONSchema } from '../interfaces/IMCPTool';
/**
 * Abstract base class for implementing tool handlers
 * Provides common functionality and enforces the tool handler contract
 */
export declare abstract class ToolHandler implements IToolHandler {
    protected readonly name: string;
    protected readonly description: string;
    protected readonly inputSchema: JSONSchema;
    protected readonly outputSchema?: JSONSchema;
    protected usageStats: ToolUsageStats;
    constructor(name: string, description: string, inputSchema: JSONSchema, outputSchema?: JSONSchema);
    /**
     * Abstract method to execute the tool with given parameters
     * Must be implemented by concrete tool handlers
     */
    abstract execute(params: any): Promise<ToolResult>;
    /**
     * Validate tool parameters against the input schema
     * Default implementation provides basic JSON Schema validation
     */
    validate(params: any): Promise<ValidationResult>;
    /**
     * Get tool usage statistics
     */
    getUsageStats(): Promise<ToolUsageStats>;
    /**
     * Cleanup resources after tool execution
     * Default implementation does nothing - override if needed
     */
    cleanup(): Promise<void>;
    /**
     * Execute tool with validation and error handling
     * This method wraps the abstract execute method with common functionality
     */
    executeWithValidation(params: any): Promise<ToolResult>;
    /**
     * Validate parameters against a JSON Schema
     */
    protected validateAgainstSchema(params: any, schema: JSONSchema): ValidationResult;
    /**
     * Update usage statistics
     */
    protected updateUsageStats(success: boolean, executionTime: number): void;
    /**
     * Create a successful tool result
     */
    protected createSuccessResult(result: any, metadata?: any): ToolResult;
    /**
     * Create a failed tool result
     */
    protected createErrorResult(error: string, metadata?: any): ToolResult;
    /**
     * Handle tool execution errors with proper error classification
     */
    protected handleToolError(error: any, operation: string): never;
    /**
     * Get handler information
     */
    getHandlerInfo(): {
        name: string;
        description: string;
        type: string;
        inputSchema: JSONSchema;
        outputSchema?: JSONSchema;
        capabilities: string[];
    };
}
/**
 * Function-based tool handler implementation
 */
export declare class FunctionToolHandler extends ToolHandler {
    private readonly executionFunction;
    constructor(name: string, description: string, inputSchema: JSONSchema, executionFunction: (params: any) => Promise<any> | any, outputSchema?: JSONSchema);
    execute(params: any): Promise<ToolResult>;
}
/**
 * Script-based tool handler implementation
 */
export declare class ScriptToolHandler extends ToolHandler {
    private readonly scriptPath;
    private readonly interpreter;
    constructor(name: string, description: string, inputSchema: JSONSchema, scriptPath: string, interpreter?: string, outputSchema?: JSONSchema);
    execute(params: any): Promise<ToolResult>;
}
/**
 * API call tool handler implementation
 */
export declare class ApiCallToolHandler extends ToolHandler {
    private readonly baseUrl;
    private readonly defaultHeaders;
    constructor(name: string, description: string, inputSchema: JSONSchema, baseUrl: string, defaultHeaders?: Record<string, string>, outputSchema?: JSONSchema);
    execute(params: any): Promise<ToolResult>;
}
//# sourceMappingURL=ToolHandler.d.ts.map