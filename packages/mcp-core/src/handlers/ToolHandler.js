/**
 * Abstract base class for MCP Tool Handlers
 */
import { randomUUID } from 'crypto';
import { MCPErrorClass, MCPErrorCode, ErrorCategory, ErrorSeverity } from '../types/error';
/**
 * Abstract base class for implementing tool handlers
 * Provides common functionality and enforces the tool handler contract
 */
export class ToolHandler {
    name;
    description;
    inputSchema;
    outputSchema;
    usageStats;
    constructor(name, description, inputSchema, outputSchema) {
        this.name = name;
        this.description = description;
        this.inputSchema = inputSchema;
        this.outputSchema = outputSchema;
        this.usageStats = {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0
        };
    }
    /**
     * Validate tool parameters against the input schema
     * Default implementation provides basic JSON Schema validation
     */
    async validate(params) {
        try {
            const validationResult = this.validateAgainstSchema(params, this.inputSchema);
            return validationResult;
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : 'Validation failed']
            };
        }
    }
    /**
     * Get tool usage statistics
     */
    async getUsageStats() {
        return { ...this.usageStats };
    }
    /**
     * Cleanup resources after tool execution
     * Default implementation does nothing - override if needed
     */
    async cleanup() {
        // Default implementation - no cleanup needed
    }
    /**
     * Execute tool with validation and error handling
     * This method wraps the abstract execute method with common functionality
     */
    async executeWithValidation(params) {
        const startTime = Date.now();
        try {
            // Validate parameters
            const validationResult = await this.validate(params);
            if (!validationResult.valid) {
                this.usageStats.failedExecutions++;
                return {
                    success: false,
                    error: `Parameter validation failed: ${validationResult.errors?.join(', ')}`,
                    metadata: {
                        executionId: randomUUID(),
                        executionTime: Date.now() - startTime,
                        toolVersion: '1.0.0',
                        warnings: ['Parameter validation failed']
                    }
                };
            }
            // Execute the tool
            const result = await this.execute(validationResult.normalizedParams || params);
            // Update statistics
            const executionTime = Date.now() - startTime;
            this.updateUsageStats(true, executionTime);
            // Add execution metadata
            if (result.metadata) {
                result.metadata.executionTime = executionTime;
            }
            else {
                result.metadata = { executionId: randomUUID(), executionTime };
            }
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.updateUsageStats(false, executionTime);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Tool execution failed',
                metadata: {
                    executionId: randomUUID(),
                    executionTime,
                    toolVersion: '1.0.0',
                    context: { error: error instanceof Error ? error.stack : 'Unknown error' }
                }
            };
        }
    }
    /**
     * Validate parameters against a JSON Schema
     */
    validateAgainstSchema(params, schema) {
        // Basic validation - in a real implementation, you'd use a proper JSON Schema validator
        const errors = [];
        if (schema.type === 'object' && typeof params !== 'object') {
            errors.push(`Expected object, got ${typeof params}`);
        }
        if (schema.required) {
            for (const requiredField of schema.required) {
                if (!(requiredField in params)) {
                    errors.push(`Missing required field: ${requiredField}`);
                }
            }
        }
        if (schema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
                if (fieldName in params) {
                    const fieldValue = params[fieldName];
                    const fieldType = fieldSchema.type;
                    if (fieldType && typeof fieldValue !== fieldType) {
                        errors.push(`Field ${fieldName}: expected ${fieldType}, got ${typeof fieldValue}`);
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            normalizedParams: params
        };
    }
    /**
     * Update usage statistics
     */
    updateUsageStats(success, executionTime) {
        this.usageStats.totalExecutions++;
        if (success) {
            this.usageStats.successfulExecutions++;
        }
        else {
            this.usageStats.failedExecutions++;
        }
        // Update average execution time
        const totalTime = this.usageStats.averageExecutionTime * (this.usageStats.totalExecutions - 1) + executionTime;
        this.usageStats.averageExecutionTime = totalTime / this.usageStats.totalExecutions;
        this.usageStats.lastExecution = new Date();
    }
    /**
     * Create a successful tool result
     */
    createSuccessResult(result, metadata) {
        return {
            success: true,
            result,
            metadata: {
                toolVersion: '1.0.0',
                ...metadata
            }
        };
    }
    /**
     * Create a failed tool result
     */
    createErrorResult(error, metadata) {
        return {
            success: false,
            error,
            metadata: {
                toolVersion: '1.0.0',
                ...metadata
            }
        };
    }
    /**
     * Handle tool execution errors with proper error classification
     */
    handleToolError(error, operation) {
        if (error instanceof MCPErrorClass) {
            throw error;
        }
        let errorCode = MCPErrorCode.TOOL_EXECUTION_FAILED;
        let severity = ErrorSeverity.MEDIUM;
        // Classify common error types
        if (error.code === 'ETIMEDOUT') {
            errorCode = MCPErrorCode.TOOL_TIMEOUT;
            severity = ErrorSeverity.MEDIUM;
        }
        else if (error.code === 'EACCES' || error.code === 'EPERM') {
            errorCode = MCPErrorCode.TOOL_PERMISSION_DENIED;
            severity = ErrorSeverity.HIGH;
        }
        else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
            errorCode = MCPErrorCode.TOOL_RESOURCE_EXHAUSTED;
            severity = ErrorSeverity.HIGH;
        }
        throw new MCPErrorClass(errorCode, `Tool ${operation} failed for ${this.name}: ${error.message || 'Unknown error'}`, {
            category: ErrorCategory.TOOL,
            severity,
            retryable: errorCode !== MCPErrorCode.TOOL_PERMISSION_DENIED,
            details: {
                toolName: this.name,
                operation,
                originalError: error.message,
                errorCode: error.code
            },
            cause: error
        });
    }
    /**
     * Get handler information
     */
    getHandlerInfo() {
        const capabilities = ['execute'];
        if (typeof this.validate === 'function')
            capabilities.push('validate');
        if (typeof this.getUsageStats === 'function')
            capabilities.push('usage-stats');
        if (typeof this.cleanup === 'function')
            capabilities.push('cleanup');
        return {
            name: this.name,
            description: this.description,
            type: this.constructor.name,
            inputSchema: this.inputSchema,
            outputSchema: this.outputSchema,
            capabilities
        };
    }
}
/**
 * Function-based tool handler implementation
 */
export class FunctionToolHandler extends ToolHandler {
    executionFunction;
    constructor(name, description, inputSchema, executionFunction, outputSchema) {
        super(name, description, inputSchema, outputSchema);
        this.executionFunction = executionFunction;
    }
    async execute(params) {
        try {
            const result = await this.executionFunction(params);
            return this.createSuccessResult(result);
        }
        catch (error) {
            return this.createErrorResult(error instanceof Error ? error.message : 'Function execution failed', { error: error instanceof Error ? error.stack : 'Unknown error' });
        }
    }
}
/**
 * Script-based tool handler implementation
 */
export class ScriptToolHandler extends ToolHandler {
    scriptPath;
    interpreter;
    constructor(name, description, inputSchema, scriptPath, interpreter = 'node', outputSchema) {
        super(name, description, inputSchema, outputSchema);
        this.scriptPath = scriptPath;
        this.interpreter = interpreter;
    }
    async execute(params) {
        try {
            const { spawn } = await import('child_process');
            const { promisify } = await import('util');
            return new Promise((resolve) => {
                const child = spawn(this.interpreter, [this.scriptPath], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                let stdout = '';
                let stderr = '';
                child.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });
                child.stderr?.on('data', (data) => {
                    stderr += data.toString();
                });
                child.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const result = JSON.parse(stdout);
                            resolve(this.createSuccessResult(result));
                        }
                        catch {
                            resolve(this.createSuccessResult(stdout));
                        }
                    }
                    else {
                        resolve(this.createErrorResult(`Script execution failed with code ${code}: ${stderr}`, { exitCode: code, stderr }));
                    }
                });
                child.on('error', (error) => {
                    resolve(this.createErrorResult(`Script execution error: ${error.message}`, { error: error.stack }));
                });
                // Send parameters as JSON to stdin
                if (child.stdin) {
                    child.stdin.write(JSON.stringify(params));
                    child.stdin.end();
                }
            });
        }
        catch (error) {
            return this.createErrorResult(error instanceof Error ? error.message : 'Script execution failed', { error: error instanceof Error ? error.stack : 'Unknown error' });
        }
    }
}
/**
 * API call tool handler implementation
 */
export class ApiCallToolHandler extends ToolHandler {
    baseUrl;
    defaultHeaders;
    constructor(name, description, inputSchema, baseUrl, defaultHeaders = {}, outputSchema) {
        super(name, description, inputSchema, outputSchema);
        this.baseUrl = baseUrl;
        this.defaultHeaders = defaultHeaders;
    }
    async execute(params) {
        try {
            const { method = 'GET', path = '', headers = {}, body } = params;
            const url = new URL(path, this.baseUrl).toString();
            const response = await fetch(url, {
                method,
                headers: {
                    ...this.defaultHeaders,
                    ...headers
                },
                body: body ? JSON.stringify(body) : undefined
            });
            if (!response.ok) {
                return this.createErrorResult(`API call failed: ${response.status} ${response.statusText}`, {
                    status: response.status,
                    statusText: response.statusText,
                    url
                });
            }
            const contentType = response.headers.get('content-type');
            let result;
            if (contentType?.includes('application/json')) {
                result = await response.json();
            }
            else {
                result = await response.text();
            }
            return this.createSuccessResult(result, {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                url
            });
        }
        catch (error) {
            return this.createErrorResult(error instanceof Error ? error.message : 'API call failed', { error: error instanceof Error ? error.stack : 'Unknown error' });
        }
    }
}
//# sourceMappingURL=ToolHandler.js.map