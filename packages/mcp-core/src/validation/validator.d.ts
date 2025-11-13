/**
 * MCP Protocol Validator using AJV
 */
/**
 * Validation result interface
 */
export interface ValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Validation errors if any */
    errors: string[];
    /** Normalized/coerced data */
    data?: any;
}
/**
 * MCP Protocol Validator class
 */
export declare class MCPValidator {
    private ajv;
    private validators;
    constructor();
    /**
     * Compile all validation schemas
     */
    private compileSchemas;
    /**
     * Validate JSON-RPC request
     */
    validateJSONRPCRequest(data: any): ValidationResult;
    /**
     * Validate JSON-RPC response
     */
    validateJSONRPCResponse(data: any): ValidationResult;
    /**
     * Validate JSON-RPC notification
     */
    validateJSONRPCNotification(data: any): ValidationResult;
    /**
     * Validate MCP request
     */
    validateMCPRequest(data: any): ValidationResult;
    /**
     * Validate MCP response
     */
    validateMCPResponse(data: any): ValidationResult;
    /**
     * Validate MCP notification
     */
    validateMCPNotification(data: any): ValidationResult;
    /**
     * Validate MCP resource
     */
    validateMCPResource(data: any): ValidationResult;
    /**
     * Validate MCP tool
     */
    validateMCPTool(data: any): ValidationResult;
    /**
     * Validate MCP capability
     */
    validateMCPCapability(data: any): ValidationResult;
    /**
     * Validate MCP service info
     */
    validateMCPServiceInfo(data: any): ValidationResult;
    /**
     * Generic validation method
     */
    validate(schemaName: string, data: any): ValidationResult;
    /**
     * Add custom schema
     */
    addSchema(name: string, schema: any): void;
    /**
     * Remove custom schema
     */
    removeSchema(name: string): boolean;
    /**
     * Get list of available schemas
     */
    getSchemaNames(): string[];
    /**
     * Check if schema exists
     */
    hasSchema(name: string): boolean;
    /**
     * Validate and throw error if invalid
     */
    validateOrThrow(schemaName: string, data: any): any;
}
/**
 * Global validator instance
 */
export declare const mcpValidator: MCPValidator;
//# sourceMappingURL=validator.d.ts.map