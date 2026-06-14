/**
 * MCP-specific error handler implementation
 * Extends the base error handler with MCP-specific functionality
 */
import { BaseErrorHandlerConfig, BaseError, ErrorContext, ErrorSeverity, ErrorCategory, Logger } from '@the-new-fuse/core-error-handling';
/**
 * MCP-specific error interface
 */
export interface MCPError extends BaseError {
    connectionId?: string;
    resourceUri?: string;
    toolName?: string;
    requestId?: string;
}
/**
 * MCP-specific error context
 */
export interface MCPErrorContext extends ErrorContext {
    connectionId?: string;
    clientId?: string;
    serverId?: string;
    protocolVersion?: string;
}
/**
 * MCP error handler configuration
 */
export interface MCPErrorHandlerConfig extends BaseErrorHandlerConfig {
    enableConnectionRecovery?: boolean;
    enableResourceRetry?: boolean;
    enableToolRetry?: boolean;
    maxConnectionRetries?: number;
}
declare const MCPUnifiedErrorHandler_base: any;
/**
 * MCP error handler implementation
 */
export declare class MCPUnifiedErrorHandler extends MCPUnifiedErrorHandler_base<MCPError, MCPErrorContext> {
    constructor(config?: Partial<MCPErrorHandlerConfig>, logger?: Logger);
    /**
     * Initialize MCP-specific recovery strategies
     */
    protected initializeDefaultRecoveryStrategies(): void;
    /**
     * Initialize MCP-specific error handlers
     */
    protected initializeDefaultErrorHandlers(): void;
    /**
     * Create MCP-specific error from generic error data
     */
    createMCPError(code: number, message: string, options?: {
        severity?: ErrorSeverity;
        category?: ErrorCategory;
        retryable?: boolean;
        connectionId?: string;
        resourceUri?: string;
        toolName?: string;
        requestId?: string;
        correlationId?: string;
        metadata?: Record<string, any>;
    }): MCPError;
    /**
     * Handle MCP connection errors specifically
     */
    handleConnectionError(connectionId: string, error: Error, context?: Partial<MCPErrorContext>): Promise<void>;
    /**
     * Handle MCP resource errors specifically
     */
    handleResourceError(resourceUri: string, error: Error, context?: Partial<MCPErrorContext>): Promise<void>;
    /**
     * Handle MCP tool errors specifically
     */
    handleToolError(toolName: string, error: Error, context?: Partial<MCPErrorContext>): Promise<void>;
    /**
     * Attempt connection recovery (placeholder implementation)
     */
    private attemptConnectionRecovery;
    /**
     * Attempt resource recovery (placeholder implementation)
     */
    private attemptResourceRecovery;
    /**
     * Attempt tool recovery (placeholder implementation)
     */
    private attemptToolRecovery;
    /**
     * Attempt authentication refresh (placeholder implementation)
     */
    private attemptAuthRefresh;
}
export {};
//# sourceMappingURL=MCPUnifiedErrorHandler.d.ts.map