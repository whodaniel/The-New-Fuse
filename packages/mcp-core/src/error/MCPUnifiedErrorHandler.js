"use strict";
/**
 * MCP-specific error handler implementation
 * Extends the base error handler with MCP-specific functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPUnifiedErrorHandler = void 0;
const types_1 = require("@the-new-fuse/types");
const stubs_1 = require("./stubs");
/**
 * MCP error handler implementation
 */
class MCPUnifiedErrorHandler extends stubs_1.BaseErrorHandler {
    constructor(config = {}, logger) {
        const mcpConfig = {
            // Base configuration with defaults
            enableAutoRecovery: config.enableAutoRecovery ?? true,
            maxRecoveryAttempts: config.maxRecoveryAttempts ?? 3,
            statisticsInterval: config.statisticsInterval ?? 60000,
            enableLogging: config.enableLogging ?? true,
            logLevel: config.logLevel ?? 'error',
            // MCP-specific configuration
            enableConnectionRecovery: config.enableConnectionRecovery ?? true,
            enableResourceRetry: config.enableResourceRetry ?? true,
            enableToolRetry: config.enableToolRetry ?? true,
            maxConnectionRetries: config.maxConnectionRetries ?? 3
        };
        super(mcpConfig, logger || new stubs_1.Logger('MCPUnifiedErrorHandler'));
    }
    /**
     * Initialize MCP-specific recovery strategies
     */
    initializeDefaultRecoveryStrategies() {
        // Connection retry strategy
        this.registerRecoveryStrategy({
            name: 'mcp-connection-retry',
            applicableErrorCodes: [-32401, -32402, -32403], // Connection errors
            maxAttempts: 3,
            delay: 1000,
            recover: async (error, context) => {
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
        this.registerRecoveryStrategy({
            name: 'mcp-resource-retry',
            applicableErrorCodes: [-32404, -32405], // Resource errors
            maxAttempts: 2,
            delay: 500,
            recover: async (error, context) => {
                this.logger.debug('Attempting MCP resource recovery', {
                    resourceUri: error.resourceUri,
                    errorCode: error.code
                });
                return this.attemptResourceRecovery(error, context);
            }
        });
        // Tool execution retry strategy
        this.registerRecoveryStrategy({
            name: 'mcp-tool-retry',
            applicableErrorCodes: [-32500, -32501], // Tool execution errors
            maxAttempts: 2,
            delay: 1000,
            recover: async (error, context) => {
                this.logger.debug('Attempting MCP tool recovery', {
                    toolName: error.toolName,
                    errorCode: error.code
                });
                return this.attemptToolRecovery(error, context);
            }
        });
        // Authentication refresh strategy
        this.registerRecoveryStrategy({
            name: 'mcp-auth-refresh',
            applicableErrorCodes: [-32303], // Token expired
            maxAttempts: 1,
            delay: 0,
            recover: async (error, context) => {
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
        this.registerErrorHandler(-32401, {
            name: 'mcp-connection-handler',
            canHandle: (error) => error.category === types_1.ErrorCategory.NETWORK,
            handle: async (error, context) => {
                this.logger.warn(`MCP connection error: ${error.message}, {
          connectionId: error.connectionId,
          clientId: context.clientId
        });
        
        // Emit specific connection error event
        this.emit('connectionError', error, context);
      }
    });

    // Resource error handler
    this.registerErrorHandler(-32404, {
      name: 'mcp-resource-handler',
      canHandle: (error: MCPUnifiedError) => !!error.resourceUri,
      handle: async (error: MCPUnifiedError, context: MCPUnifiedErrorContext) => {`, this.logger.warn(`MCP resource error: ${error.message}`, {
                    resourceUri: error.resourceUri,
                    operation: context.operation
                }));
                // Emit specific resource error event
                this.emit('resourceError', error, context);
            }
        });
        // Tool execution error handler
        this.registerErrorHandler(-32500, {
            name: 'mcp-tool-handler',
            canHandle: (error) => !!error.toolName,
            handle: async (error, context) => {
                this.logger.warn(MCP, tool, error, $, { error, : .message }, {
                    toolName: error.toolName,
                    operation: context.operation
                });
                // Emit specific tool error event
                this.emit('toolError', error, context);
            }
        });
        // Generic MCP error handler
        this.registerErrorHandler(-1, {
            name: 'mcp-generic-handler',
            canHandle: () => true,
            handle: async (error, context) => {
                `
        this.logger.debug(Generic MCP handler processing error: ${error.code}`;
            }
        });
        // Default MCP error handling logic
        this.emit('mcpError', error, context);
    }
}
exports.MCPUnifiedErrorHandler = MCPUnifiedErrorHandler;
;
/**
 * Create MCP-specific error from generic error data
 */
createMCPError(code, number, message, string, options, {
    severity: types_1.ErrorSeverity,
    category: types_1.ErrorCategory,
    retryable: boolean,
    connectionId: string,
    resourceUri: string,
    toolName: string,
    requestId: string,
    correlationId: string,
    metadata: (Record)
} = {});
MCPUnifiedError;
{
    return {
        code,
        message,
        timestamp: new Date(),
        severity: options.severity || types_1.ErrorSeverity.MEDIUM,
        category: options.category || types_1.ErrorCategory.UNKNOWN,
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
async;
handleConnectionError(connectionId, string, error, Error, context, (Partial) = {});
Promise < void  > {
    const: mcpError = this.createMCPError(-32401, Connection, error, $, { error, : .message }, {
        severity: types_1.ErrorSeverity.HIGH,
        category: types_1.ErrorCategory.NETWORK,
        connectionId,
        retryable: true
    }),
    const: mcpContext, MCPUnifiedErrorContext = {
        component: 'mcp-connection',
        operation: 'connect',
        connectionId,
        ...context
    },
    await, this: .handleError(mcpError, mcpContext)
};
/**
 * Handle MCP resource errors specifically
 */
async;
handleResourceError(resourceUri, string, error, Error, context, (Partial) = {});
Promise < void  > {} `
    const mcpError = this.createMCPError(`
    - 32404,
    Resource;
error: $;
{
    error.message;
}
`,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SYSTEM,
        resourceUri,
        retryable: true
      }
    );

    const mcpContext: MCPUnifiedErrorContext = {
      component: 'mcp-resource',
      operation: 'access',
      ...context
    };

    await this.handleError(mcpError, mcpContext);
  }

  /**
   * Handle MCP tool errors specifically
   */
  async handleToolError(
    toolName: string,
    error: Error,
    context: Partial<MCPUnifiedErrorContext> = {}
  ): Promise<void> {
    const mcpError = this.createMCPError(
      -32500,
      Tool error: ${error.message}`,
    {
        severity: types_1.ErrorSeverity.MEDIUM,
        category: types_1.ErrorCategory.BUSINESS_LOGIC,
        toolName,
        retryable: true
    };
;
const mcpContext = {
    component: 'mcp-tool',
    operation: 'execute',
    ...context
};
await this.handleError(mcpError, mcpContext);
async;
attemptConnectionRecovery(error, MCPUnifiedError, context, MCPUnifiedErrorContext);
Promise < boolean > {
    // This would be implemented by the specific MCP client/server
    // For now, return false to indicate recovery failed
    this: .logger.debug('Connection recovery not implemented yet'),
    return: false
};
async;
attemptResourceRecovery(error, MCPUnifiedError, context, MCPUnifiedErrorContext);
Promise < boolean > {
    // This would be implemented by the specific resource manager
    this: .logger.debug('Resource recovery not implemented yet'),
    return: false
};
async;
attemptToolRecovery(error, MCPUnifiedError, context, MCPUnifiedErrorContext);
Promise < boolean > {
    // This would be implemented by the specific tool manager
    this: .logger.debug('Tool recovery not implemented yet'),
    return: false
};
async;
attemptAuthRefresh(error, MCPUnifiedError, context, MCPUnifiedErrorContext);
Promise < boolean > {
    // This would be implemented by the authentication manager
    this: .logger.debug('Auth refresh not implemented yet'),
    return: false
};
//# sourceMappingURL=MCPUnifiedErrorHandler.js.map