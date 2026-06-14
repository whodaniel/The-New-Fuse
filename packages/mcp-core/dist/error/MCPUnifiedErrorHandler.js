/**
 * MCP-specific error handler implementation
 * Extends the base error handler with MCP-specific functionality
 */
import { BaseErrorHandler, ErrorSeverity, ErrorCategory, Logger } from '@the-new-fuse/core-error-handling';
/**
 * MCP error handler implementation
 */
export class MCPUnifiedErrorHandler extends BaseErrorHandler {
    constructor(config = {}, logger) {
        const mcpConfig = {
            // Base configuration with defaults
            // @ts-ignore
            enableAutoRecovery: config.enableAutoRecovery ?? true,
            // @ts-ignore
            maxRecoveryAttempts: config.maxRecoveryAttempts ?? 3,
            // @ts-ignore
            statisticsInterval: config.statisticsInterval ?? 60000,
            // @ts-ignore
            enableLogging: config.enableLogging ?? true,
            // @ts-ignore
            logLevel: config.logLevel ?? 'error',
            // MCP-specific configuration
            enableConnectionRecovery: config.enableConnectionRecovery ?? true,
            enableResourceRetry: config.enableResourceRetry ?? true,
            enableToolRetry: config.enableToolRetry ?? true,
            maxConnectionRetries: config.maxConnectionRetries ?? 3
        };
        // @ts-ignore
        super(mcpConfig, logger || new Logger('MCPUnifiedErrorHandler'));
    }
    /**
     * Initialize MCP-specific recovery strategies
     */
    initializeDefaultRecoveryStrategies() {
        // Connection retry strategy
        // @ts-ignore
        this.registerRecoveryStrategy({
            name: 'mcp-connection-retry',
            applicableErrorCodes: [-32401, -32402, -32403], // Connection errors
            maxAttempts: 3,
            delay: 1000,
            recover: async (error, context) => {
                // @ts-ignore
                this.logger.debug('Attempting MCP connection recovery', {
                    connectionId: error.connectionId,
                    errorCode: error.code
                });
                // Implementation would depend on the specific MCP client/server
                // This is a placeholder for the actual recovery logic
                return this.attemptConnectionRecovery(error, context);
            }
        });
        // Resource retry strategy
        // @ts-ignore
        this.registerRecoveryStrategy({
            name: 'mcp-resource-retry',
            applicableErrorCodes: [-32404, -32405], // Resource errors
            maxAttempts: 2,
            delay: 500,
            recover: async (error, context) => {
                // @ts-ignore
                this.logger.debug('Attempting MCP resource recovery', {
                    resourceUri: error.resourceUri,
                    errorCode: error.code
                });
                return this.attemptResourceRecovery(error, context);
            }
        });
        // Tool execution retry strategy
        // @ts-ignore
        this.registerRecoveryStrategy({
            name: 'mcp-tool-retry',
            applicableErrorCodes: [-32500, -32501], // Tool execution errors
            maxAttempts: 2,
            delay: 1000,
            recover: async (error, context) => {
                // @ts-ignore
                this.logger.debug('Attempting MCP tool recovery', {
                    toolName: error.toolName,
                    errorCode: error.code
                });
                return this.attemptToolRecovery(error, context);
            }
        });
        // Authentication refresh strategy
        // @ts-ignore
        this.registerRecoveryStrategy({
            name: 'mcp-auth-refresh',
            applicableErrorCodes: [-32303], // Token expired
            maxAttempts: 1,
            delay: 0,
            recover: async (error, context) => {
                // @ts-ignore
                this.logger.debug('Attempting MCP authentication refresh');
                return this.attemptAuthRefresh(error, context);
            }
        });
    }
    /**
     * Initialize MCP-specific error handlers
     */
    initializeDefaultErrorHandlers() {
        // Connection error handler
        // @ts-ignore
        this.registerErrorHandler(-32401, {
            name: 'mcp-connection-handler',
            canHandle: (error) => error.category === ErrorCategory.NETWORK,
            handle: async (error, context) => {
                // @ts-ignore
                this.logger.warn(`MCP connection error: ${error.message}`, {
                    connectionId: error.connectionId,
                    clientId: context.clientId
                });
                // Emit specific connection error event
                // @ts-ignore
                this.emit('connectionError', error, context);
            }
        });
        // Resource error handler
        // @ts-ignore
        this.registerErrorHandler(-32404, {
            name: 'mcp-resource-handler',
            canHandle: (error) => !!error.resourceUri,
            handle: async (error, context) => {
                // @ts-ignore
                this.logger.warn(`MCP resource error: ${error.message}`, {
                    resourceUri: error.resourceUri,
                    // @ts-ignore
                    operation: context.operation
                });
                // Emit specific resource error event
                // @ts-ignore
                this.emit('resourceError', error, context);
            }
        });
        // Tool execution error handler
        // @ts-ignore
        this.registerErrorHandler(-32500, {
            name: 'mcp-tool-handler',
            canHandle: (error) => !!error.toolName,
            handle: async (error, context) => {
                // @ts-ignore
                this.logger.warn(`MCP tool error: ${error.message}`, {
                    toolName: error.toolName,
                    // @ts-ignore
                    operation: context.operation
                });
                // Emit specific tool error event
                // @ts-ignore
                this.emit('toolError', error, context);
            }
        });
        // Generic MCP error handler
        // @ts-ignore
        this.registerErrorHandler(-1, {
            name: 'mcp-generic-handler',
            canHandle: () => true,
            handle: async (error, context) => {
                // @ts-ignore
                this.logger.debug(`Generic MCP handler processing error: ${error.code}`);
                // Default MCP error handling logic
                // @ts-ignore
                this.emit('mcpError', error, context);
            }
        });
    }
    /**
     * Create MCP-specific error from generic error data
     */
    createMCPError(code, message, options = {}) {
        return {
            // @ts-ignore
            code,
            message,
            timestamp: new Date(),
            severity: options.severity || ErrorSeverity.MEDIUM,
            category: options.category || ErrorCategory.UNKNOWN,
            retryable: options.retryable ?? true,
            connectionId: options.connectionId,
            resourceUri: options.resourceUri,
            toolName: options.toolName,
            requestId: options.requestId,
            correlationId: options.correlationId,
            metadata: options.metadata
        };
    }
    /**
     * Handle MCP connection errors specifically
     */
    async handleConnectionError(connectionId, error, context = {}) {
        const mcpError = this.createMCPError(-32401, `Connection error: ${error.message}`, {
            severity: ErrorSeverity.HIGH,
            category: ErrorCategory.NETWORK,
            connectionId,
            retryable: true
        });
        const mcpContext = {
            // @ts-ignore
            component: 'mcp-connection',
            // @ts-ignore
            operation: 'connect',
            connectionId,
            ...context
        };
        // @ts-ignore
        await this.handleError(mcpError, mcpContext);
    }
    /**
     * Handle MCP resource errors specifically
     */
    async handleResourceError(resourceUri, error, context = {}) {
        const mcpError = this.createMCPError(-32404, `Resource error: ${error.message}`, {
            severity: ErrorSeverity.MEDIUM,
            category: ErrorCategory.SYSTEM,
            resourceUri,
            retryable: true
        });
        const mcpContext = {
            // @ts-ignore
            component: 'mcp-resource',
            // @ts-ignore
            operation: 'access',
            ...context
        };
        // @ts-ignore
        await this.handleError(mcpError, mcpContext);
    }
    /**
     * Handle MCP tool errors specifically
     */
    async handleToolError(toolName, error, context = {}) {
        const mcpError = this.createMCPError(-32500, `Tool error: ${error.message}`, {
            severity: ErrorSeverity.MEDIUM,
            category: ErrorCategory.BUSINESS,
            toolName,
            retryable: true
        });
        const mcpContext = {
            // @ts-ignore
            component: 'mcp-tool',
            // @ts-ignore
            operation: 'execute',
            ...context
        };
        // @ts-ignore
        await this.handleError(mcpError, mcpContext);
    }
    /**
     * Attempt connection recovery (placeholder implementation)
     */
    async attemptConnectionRecovery(error, context) {
        // This would be implemented by the specific MCP client/server
        // For now, return false to indicate recovery failed
        // @ts-ignore
        this.logger.debug('Connection recovery not implemented yet');
        return false;
    }
    /**
     * Attempt resource recovery (placeholder implementation)
     */
    async attemptResourceRecovery(error, context) {
        // This would be implemented by the specific resource manager
        // @ts-ignore
        this.logger.debug('Resource recovery not implemented yet');
        return false;
    }
    /**
     * Attempt tool recovery (placeholder implementation)
     */
    async attemptToolRecovery(error, context) {
        // This would be implemented by the specific tool manager
        // @ts-ignore
        this.logger.debug('Tool recovery not implemented yet');
        return false;
    }
    /**
     * Attempt authentication refresh (placeholder implementation)
     */
    async attemptAuthRefresh(error, context) {
        // This would be implemented by the authentication manager
        // @ts-ignore
        this.logger.debug('Auth refresh not implemented yet');
        return false;
    }
}
//# sourceMappingURL=MCPUnifiedErrorHandler.js.map