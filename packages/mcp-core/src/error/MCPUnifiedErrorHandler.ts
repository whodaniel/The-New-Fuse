/**
 * MCP-specific error handler implementation
 * Extends the base error handler with MCP-specific functionality
 */

import {
  BaseErrorHandler,
  BaseErrorHandlerConfig,
  BaseError,
  ErrorContext,
  ErrorHandler,
  RecoveryStrategy,
  ErrorSeverity,
  ErrorCategory,
  Logger
} from '@the-new-fuse/core-error-handling';

/**
 * MCP-specific error interface
 */
export interface MCPError extends BaseError {
  // MCP-specific error properties
  connectionId?: string;
  resourceUri?: string;
  toolName?: string;
  requestId?: string;
}

/**
 * MCP-specific error context
 */
export interface MCPErrorContext extends ErrorContext {
  // MCP-specific context properties
  connectionId?: string;
  clientId?: string;
  serverId?: string;
  protocolVersion?: string;
}

/**
 * MCP error handler configuration
 */
export interface MCPErrorHandlerConfig extends BaseErrorHandlerConfig {
  // MCP-specific configuration
  enableConnectionRecovery?: boolean;
  enableResourceRetry?: boolean;
  enableToolRetry?: boolean;
  maxConnectionRetries?: number;
}

/**
 * MCP error handler implementation
 */
export class MCPUnifiedErrorHandler extends (BaseErrorHandler as any)<MCPError, MCPErrorContext> {
  
  constructor(config: Partial<MCPErrorHandlerConfig> = {}, logger?: Logger) {
    const mcpConfig: MCPErrorHandlerConfig = {
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
  protected initializeDefaultRecoveryStrategies(): void {
    // Connection retry strategy
    // @ts-ignore
    this.registerRecoveryStrategy({
      name: 'mcp-connection-retry',
      applicableErrorCodes: [-32401, -32402, -32403], // Connection errors
      maxAttempts: 3,
      delay: 1000,
      recover: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.debug('Attempting MCP connection recovery', {
          connectionId: error.connectionId,
          errorCode: (error as any).code
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
      recover: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.debug('Attempting MCP resource recovery', {
          resourceUri: (error as any).resourceUri,
          errorCode: (error as any).code
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
      recover: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.debug('Attempting MCP tool recovery', {
          toolName: (error as any).toolName,
          errorCode: (error as any).code
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
      recover: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.debug('Attempting MCP authentication refresh');
        return this.attemptAuthRefresh(error, context);
      }
    });
  }

  /**
   * Initialize MCP-specific error handlers
   */
  protected initializeDefaultErrorHandlers(): void {
    // Connection error handler
    // @ts-ignore
    this.registerErrorHandler(-32401, {
      name: 'mcp-connection-handler',
      canHandle: (error: MCPError) => (error as any).category === ErrorCategory.NETWORK,
      handle: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.warn(`MCP connection error: ${(error as any).message}`, {
          connectionId: error.connectionId,
          clientId: (context as any).clientId
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
      canHandle: (error: MCPError) => !!(error as any).resourceUri,
      handle: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.warn(`MCP resource error: ${(error as any).message}`, {
          resourceUri: (error as any).resourceUri,
          // @ts-ignore
          operation: (context as any).operation
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
      canHandle: (error: MCPError) => !!(error as any).toolName,
      handle: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.warn(`MCP tool error: ${(error as any).message}`, {
          toolName: (error as any).toolName,
          // @ts-ignore
          operation: (context as any).operation
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
      handle: async (error: MCPError, context: MCPErrorContext) => {
        // @ts-ignore
        this.logger.debug(`Generic MCP handler processing error: ${(error as any).code}`);
        
        // Default MCP error handling logic
        // @ts-ignore
        this.emit('mcpError', error, context);
      }
    });
  }

  /**
   * Create MCP-specific error from generic error data
   */
  createMCPError(
    code: number,
    message: string,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      retryable?: boolean;
      connectionId?: string;
      resourceUri?: string;
      toolName?: string;
      requestId?: string;
      correlationId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): MCPError {
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
  async handleConnectionError(
    connectionId: string,
    error: Error,
    context: Partial<MCPErrorContext> = {}
  ): Promise<void> {
    const mcpError = this.createMCPError(
      -32401,
      `Connection error: ${(error as any).message}`,
      {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
        connectionId,
        retryable: true
      }
    );

    const mcpContext: MCPErrorContext = {
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
  async handleResourceError(
    resourceUri: string,
    error: Error,
    context: Partial<MCPErrorContext> = {}
  ): Promise<void> {
    const mcpError = this.createMCPError(
      -32404,
      `Resource error: ${(error as any).message}`,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SYSTEM,
        resourceUri,
        retryable: true
      }
    );

    const mcpContext: MCPErrorContext = {
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
  async handleToolError(
    toolName: string,
    error: Error,
    context: Partial<MCPErrorContext> = {}
  ): Promise<void> {
    const mcpError = this.createMCPError(
      -32500,
      `Tool error: ${(error as any).message}`,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS,
        toolName,
        retryable: true
      }
    );

    const mcpContext: MCPErrorContext = {
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
  private async attemptConnectionRecovery(error: MCPError, context: MCPErrorContext): Promise<boolean> {
    // This would be implemented by the specific MCP client/server
    // For now, return false to indicate recovery failed
    // @ts-ignore
    this.logger.debug('Connection recovery not implemented yet');
    return false;
  }

  /**
   * Attempt resource recovery (placeholder implementation)
   */
  private async attemptResourceRecovery(error: MCPError, context: MCPErrorContext): Promise<boolean> {
    // This would be implemented by the specific resource manager
    // @ts-ignore
    this.logger.debug('Resource recovery not implemented yet');
    return false;
  }

  /**
   * Attempt tool recovery (placeholder implementation)
   */
  private async attemptToolRecovery(error: MCPError, context: MCPErrorContext): Promise<boolean> {
    // This would be implemented by the specific tool manager
    // @ts-ignore
    this.logger.debug('Tool recovery not implemented yet');
    return false;
  }

  /**
   * Attempt authentication refresh (placeholder implementation)
   */
  private async attemptAuthRefresh(error: MCPError, context: MCPErrorContext): Promise<boolean> {
    // This would be implemented by the authentication manager
    // @ts-ignore
    this.logger.debug('Auth refresh not implemented yet');
    return false;
  }
}