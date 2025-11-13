/**
 * MCP-specific error handler implementation
 * Extends the base error handler with MCP-specific functionality
 */
import { BaseErrorHandler, BaseErrorHandlerConfig, BaseError, ErrorContext, Logger } from './stubs';
/**
 * MCP-specific error interface
 */
export interface MCPUnifiedError extends BaseError {
    connectionId?: string;
    resourceUri?: string;
    toolName?: string;
    requestId?: string;
    correlationId?: string;
    metadata?: unknown;
}
/**
 * MCP-specific error context
 */
export interface MCPUnifiedErrorContext extends ErrorContext {
    connectionId?: string;
    clientId?: string;
    serverId?: string;
    protocolVersion?: string;
}
/**
 * MCP error handler configuration
 */
export interface MCPUnifiedErrorHandlerConfig extends BaseErrorHandlerConfig {
    enableConnectionRecovery?: boolean;
    enableResourceRetry?: boolean;
    enableToolRetry?: boolean;
    maxConnectionRetries?: number;
}
/**
 * MCP error handler implementation
 */
export declare class MCPUnifiedErrorHandler extends BaseErrorHandler {
    constructor(config?: Partial<MCPUnifiedErrorHandlerConfig>, logger?: Logger);
    /**
     * Initialize MCP-specific recovery strategies
     */
    protected initializeDefaultRecoveryStrategies(): void;
    /**
     * Initialize MCP-specific error handlers
     */
    protected initializeDefaultErrorHandlers(): void;
}
//# sourceMappingURL=MCPUnifiedErrorHandler.d.ts.map