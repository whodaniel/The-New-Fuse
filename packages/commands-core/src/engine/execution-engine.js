"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionEngine = void 0;
const eventemitter3_1 = require("eventemitter3");
const interfaces_1 = require("../interfaces");
const event_types_1 = require("../events/event-types");
/**
 * Event-driven command execution engine
 */
class ExecutionEngine extends eventemitter3_1.EventEmitter {
    registry;
    middleware = [];
    interceptors = [];
    config;
    stats;
    constructor(registry, config = {}) {
        super();
        this.registry = registry;
        this.config = {
            enableValidation: true,
            enableLogging: true,
            enableMetrics: true,
            defaultTimeout: 30000,
            maxConcurrentCommands: 100,
            enableRetries: false,
            maxRetries: 3,
            retryDelay: 1000,
            ...config
        };
        this.stats = this.initializeStats();
    }
    /**
     * Execute a command through the full pipeline
     */
    async execute(command, context) {
        const fullContext = this.createContext(context);
        const startTime = Date.now();
        try {
            // Emit execution started event
            this.emitEvent(new event_types_1.CommandExecutionStartedEvent({
                commandType: command.type,
                executionId: fullContext.executionId,
                userId: fullContext.userId,
                sessionId: fullContext.sessionId,
                correlationId: fullContext.correlationId
            }));
            // Execute through middleware pipeline
            const result = await this.executeThroughPipeline(command, fullContext);
            // Update statistics
            this.updateStats(command.type, result.success, Date.now() - startTime);
            // Emit completion event
            this.emitEvent(new event_types_1.CommandExecutionCompletedEvent({
                commandType: command.type,
                executionId: fullContext.executionId,
                executionTime: Date.now() - startTime,
                success: result.success,
                result: result.data,
                eventCount: result.events.length
            }));
            // Emit performance metrics
            if (this.config.enableMetrics) {
                this.emitEvent(new event_types_1.PerformanceMetricsEvent({
                    commandType: command.type,
                    executionId: fullContext.executionId,
                    metrics: {
                        executionTime: Date.now() - startTime,
                        ...result.metadata.stats
                    }
                }));
            }
            return result;
        }
        catch (error) {
            // Update error statistics
            this.updateStats(command.type, false, Date.now() - startTime);
            // Emit failure event
            this.emitEvent(new event_types_1.CommandExecutionFailedEvent({
                commandType: command.type,
                executionId: fullContext.executionId,
                error: {
                    code: 'EXECUTION_ENGINE_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    type: interfaces_1.ErrorType.INTERNAL,
                    stack: error instanceof Error ? error.stack : undefined
                },
                executionTime: Date.now() - startTime
            }));
            throw error;
        }
    }
    /**
     * Execute command through the middleware pipeline
     */
    async executeThroughPipeline(command, context) {
        // Sort middleware by priority
        const sortedMiddleware = [...this.middleware].sort((a, b) => (a.priority || 0) - (b.priority || 0));
        // Create pipeline execution function
        const executeNext = async (index = 0) => {
            if (index >= sortedMiddleware.length) {
                // All middleware executed, run the command
                return this.executeCommand(command, context);
            }
            const middleware = sortedMiddleware[index];
            const middlewareStartTime = Date.now();
            try {
                const result = await middleware.execute(command, context, () => executeNext(index + 1));
                // Emit middleware execution event
                this.emitEvent(new event_types_1.MiddlewareExecutedEvent({
                    middlewareName: middleware.name,
                    commandType: command.type,
                    executionId: context.executionId,
                    executionTime: Date.now() - middlewareStartTime,
                    success: true
                }));
                return result;
            }
            catch (error) {
                // Emit middleware error event
                this.emitEvent(new event_types_1.MiddlewareExecutedEvent({
                    middlewareName: middleware.name,
                    commandType: command.type,
                    executionId: context.executionId,
                    executionTime: Date.now() - middlewareStartTime,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                }));
                throw error;
            }
        };
        return executeNext();
    }
    /**
     * Execute the command with interceptors
     */
    async executeCommand(command, context) {
        try {
            // Run before interceptors
            await this.runInterceptors('before', command, context);
            // Validate command if enabled
            if (this.config.enableValidation) {
                await this.validateCommand(command, context);
            }
            // Get handler and execute
            const handler = this.getHandler(command);
            if (!handler) {
                throw new Error(`No handler registered for command type: ${command.type});
      }

      const result = await handler.handle(command, context);

      // Emit domain events
      for (const event of result.events) {
        this.emitEvent(new DomainEventPublishedEvent({
          eventType: event.type,
          eventId: event.id,
          commandType: command.type,
          executionId: context.executionId,
          aggregateId: event.metadata.aggregateId,
          aggregateType: event.metadata.aggregateType
        }));
      }

      // Run after interceptors
      await this.runInterceptors('after', command, context, result);

      return result;

    } catch (error) {
      // Run error interceptors
      await this.runInterceptors('error', command, context, error as Error);
      throw error;
    }
  }

  /**
   * Validate the command
   */
  private async validateCommand<TData, TResult>(
    command: ICommand<TData, TResult>,
    context: ICommandContext
  ): Promise<void> {
    this.emitEvent(new CommandValidationStartedEvent({
      commandType: command.type,
      executionId: context.executionId
    }));

    const validation = await command.validate(context);

    this.emitEvent(new CommandValidationCompletedEvent({
      commandType: command.type,
      executionId: context.executionId,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    }));

    if (!validation.isValid) {`);
                throw new Error(`Command validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
            }
        }
        /**
         * Run interceptors for a specific phase
         */
        finally {
        }
        /**
         * Run interceptors for a specific phase
         */
    }
    /**
     * Run interceptors for a specific phase
     */
    async runInterceptors(phase, command, context, result) {
        for (const interceptor of this.interceptors) {
            const interceptorStartTime = Date.now();
            try {
                switch (phase) {
                    case 'before':
                        if (interceptor.beforeExecute) {
                            await interceptor.beforeExecute(command, context);
                        }
                        break;
                    case 'after':
                        if (interceptor.afterExecute && result && 'success' in result) {
                            await interceptor.afterExecute(command, context, result);
                        }
                        break;
                    case 'error':
                        if (interceptor.onError && result instanceof Error) {
                            await interceptor.onError(command, context, result);
                        }
                        break;
                }
                // Emit interceptor execution event
                this.emitEvent(new event_types_1.InterceptorExecutedEvent({
                    interceptorName: interceptor.name,
                    phase,
                    commandType: command.type,
                    executionId: context.executionId,
                    executionTime: Date.now() - interceptorStartTime,
                    success: true
                }));
            }
            catch (error) {
                // Emit interceptor error event
                this.emitEvent(new event_types_1.InterceptorExecutedEvent({
                    interceptorName: interceptor.name,
                    phase,
                    commandType: command.type,
                    executionId: context.executionId,
                    executionTime: Date.now() - interceptorStartTime,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                }));
                // Log interceptor error but don't stop execution
                if (this.config.enableLogging) {
                    console.error(Interceptor, $, { interceptor, : .name }, failed in $, { phase }, phase, `, error);
        }
      }
    }
  }

  /**
   * Get handler for a command
   */
  private getHandler<TData, TResult>(command: ICommand<TData, TResult>): ICommandHandler<TData, TResult> | undefined {
    // Try to get direct handler first
    let handler = this.registry.getHandler<TData, TResult>(command.type);
    
    // If no direct handler, try to create from factory
    if (!handler) {
      handler = this.registry.createHandler<TData, TResult>(command.type);
    }

    return handler;
  }

  /**
   * Create execution context
   */
  private createContext(partial?: Partial<ICommandContext>): ICommandContext {
    return {
      executionId: uuidv4(),
      timestamp: new Date(),
      data: {},
      auth: {
        isAuthenticated: false,
        roles: [],
        permissions: [],
        claims: {}
      },
      ...partial
    };
  }

  /**
   * Emit an event
   */
  private emitEvent(event: BaseEvent): void {
    this.emit(event.type, event);
    this.emit('*', event); // Wildcard event listener
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): CommandBusStats {
    return {
      totalExecuted: 0,
      successful: 0,
      failed: 0,
      registeredHandlers: 0,
      registeredMiddleware: 0,
      registeredInterceptors: 0,
      averageExecutionTime: 0,
      executionCounts: {},
      errorCounts: {}
    };
  }

  /**
   * Update execution statistics
   */
  private updateStats(commandType: string, success: boolean, executionTime: number): void {
    this.stats.totalExecuted++;
    
    if (success) {
      this.stats.successful++;
    } else {
      this.stats.failed++;
    }

    // Update execution counts
    this.stats.executionCounts[commandType] = (this.stats.executionCounts[commandType] || 0) + 1;

    // Update error counts
    if (!success) {
      this.stats.errorCounts[commandType] = (this.stats.errorCounts[commandType] || 0) + 1;
    }

    // Update average execution time
    this.stats.averageExecutionTime = 
      (this.stats.averageExecutionTime * (this.stats.totalExecuted - 1) + executionTime) / 
      this.stats.totalExecuted;

    // Update registered counts
    this.stats.registeredHandlers = this.registry.getCommandTypes().length;
    this.stats.registeredMiddleware = this.middleware.length;
    this.stats.registeredInterceptors = this.interceptors.length;
  }

  /**
   * Add middleware to the pipeline
   */
  public use(middleware: ICommandMiddleware): void {
    this.middleware.push(middleware);
    this.stats.registeredMiddleware = this.middleware.length;
  }

  /**
   * Add interceptor
   */
  public intercept(interceptor: ICommandInterceptor): void {
    this.interceptors.push(interceptor);
    this.stats.registeredInterceptors = this.interceptors.length;
  }

  /**
   * Get current statistics
   */
  public getStats(): CommandBusStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * Get configuration
   */
  public getConfig(): ICommandBusConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ICommandBusConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all middleware and interceptors
   */
  public clear(): void {
    this.middleware = [];
    this.interceptors = [];
    this.resetStats();
  }

  /**
   * Listen to specific event types
   */
  public onEvent<T extends BaseEvent>(
    eventType: string,
    listener: (event: T) => void
  ): void {
    this.on(eventType, listener);
  }

  /**
   * Listen to all events
   */
  public onAllEvents(listener: (event: BaseEvent) => void): void {
    this.on('*', listener);
  }

  /**
   * Remove event listener
   */
  public offEvent<T extends BaseEvent>(
    eventType: string,
    listener: (event: T) => void
  ): void {
    this.off(eventType, listener);
  }

  /**
   * Remove all event listeners
   */
  public removeAllEventListeners(): void {
    this.removeAllListeners();
  }
});
                }
            }
        }
    }
}
exports.ExecutionEngine = ExecutionEngine;
//# sourceMappingURL=execution-engine.js.map