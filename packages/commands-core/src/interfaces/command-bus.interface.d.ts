import { ICommand, ICommandContext, ICommandResult } from './command.interface';
/**
 * Command bus interface for command dispatch and handling
 */
export interface ICommandBus {
    /**
     * Execute a command synchronously
     */
    execute<TData, TResult>(command: ICommand<TData, TResult>): Promise<ICommandResult<TResult>>;
    /**
     * Execute a command with a custom context
     */
    executeWithContext<TData, TResult>(command: ICommand<TData, TResult>, context: ICommandContext): Promise<ICommandResult<TResult>>;
    /**
     * Register a command handler for a specific command type
     */
    register<TData, TResult>(commandType: string, handler: ICommandHandler<TData, TResult>): void;
    /**
     * Register a command handler factory
     */
    registerFactory<TData, TResult>(commandType: string, factory: ICommandHandlerFactory<TData, TResult>): void;
    /**
     * Unregister a command handler
     */
    unregister(commandType: string): void;
    /**
     * Check if a handler is registered for a command type
     */
    hasHandler(commandType: string): boolean;
    /**
     * Get the handler for a command type
     */
    getHandler<TData, TResult>(commandType: string): ICommandHandler<TData, TResult> | undefined;
    /**
     * Set middleware for command processing pipeline
     */
    use(middleware: ICommandMiddleware): void;
    /**
     * Set interceptors for cross-cutting concerns
     */
    intercept(interceptor: ICommandInterceptor): void;
    /**
     * Get command bus statistics
     */
    getStats(): CommandBusStats;
    /**
     * Clear all handlers and middleware
     */
    clear(): void;
}
/**
 * Command handler interface
 */
export interface ICommandHandler<TData = any, TResult = any> {
    /**
     * Handle the command
     */
    handle(command: ICommand<TData, TResult>, context: ICommandContext): Promise<ICommandResult<TResult>>;
    /**
     * Check if the handler can handle the command
     */
    canHandle(command: ICommand): boolean;
    /**
     * Get handler metadata
     */
    getMetadata(): HandlerMetadata;
}
/**
 * Command handler factory interface
 */
export interface ICommandHandlerFactory<TData = any, TResult = any> {
    /**
     * Create a new command handler instance
     */
    create(): ICommandHandler<TData, TResult>;
    /**
     * Get factory metadata
     */
    getMetadata(): FactoryMetadata;
}
/**
 * Command middleware interface
 */
export interface ICommandMiddleware {
    /**
     * Middleware name for identification
     */
    readonly name: string;
    /**
     * Execute middleware in the command pipeline
     */
    execute(command: ICommand, context: ICommandContext, next: () => Promise<ICommandResult>): Promise<ICommandResult>;
    /**
     * Middleware priority (lower numbers execute first)
     */
    readonly priority?: number;
}
/**
 * Command interceptor interface
 */
export interface ICommandInterceptor {
    /**
     * Interceptor name for identification
     */
    readonly name: string;
    /**
     * Intercept command before execution
     */
    beforeExecute?(command: ICommand, context: ICommandContext): Promise<void>;
    /**
     * Intercept command after execution
     */
    afterExecute?(command: ICommand, context: ICommandContext, result: ICommandResult): Promise<void>;
    /**
     * Intercept command execution error
     */
    onError?(command: ICommand, context: ICommandContext, error: Error): Promise<void>;
}
/**
 * Handler metadata
 */
export interface HandlerMetadata {
    /**
     * Handler name
     */
    readonly name: string;
    /**
     * Handler description
     */
    readonly description?: string;
    /**
     * Command types this handler can process
     */
    readonly commandTypes: string[];
    /**
     * Handler version
     */
    readonly version: string;
    /**
     * Handler tags
     */
    readonly tags?: string[];
    /**
     * Custom metadata properties
     */
    readonly [key: string]: any;
}
/**
 * Factory metadata
 */
export interface FactoryMetadata {
    /**
     * Factory name
     */
    readonly name: string;
    /**
     * Factory description
     */
    readonly description?: string;
    /**
     * Command types this factory can create handlers for
     */
    readonly commandTypes: string[];
    /**
     * Factory version
     */
    readonly version: string;
    /**
     * Singleton factory flag
     */
    readonly singleton: boolean;
    /**
     * Custom metadata properties
     */
    readonly [key: string]: any;
}
/**
 * Command bus statistics
 */
export interface CommandBusStats {
    /**
     * Total number of commands executed
     */
    totalExecuted: number;
    /**
     * Number of successful executions
     */
    successful: number;
    /**
     * Number of failed executions
     */
    failed: number;
    /**
     * Number of registered handlers
     */
    registeredHandlers: number;
    /**
     * Number of registered middleware
     */
    registeredMiddleware: number;
    /**
     * Number of registered interceptors
     */
    registeredInterceptors: number;
    /**
     * Average execution time in milliseconds
     */
    averageExecutionTime: number;
    /**
     * Last execution timestamp
     */
    lastExecution?: Date;
    /**
     * Command execution counts by type
     */
    executionCounts: Record<string, number>;
    /**
     * Error counts by type
     */
    errorCounts: Record<string, number>;
}
/**
 * Command bus configuration
 */
export interface ICommandBusConfig {
    /**
     * Enable command validation
     */
    readonly enableValidation: boolean;
    /**
     * Enable command logging
     */
    readonly enableLogging: boolean;
    /**
     * Enable metrics collection
     */
    readonly enableMetrics: boolean;
    /**
     * Default timeout for command execution in milliseconds
     */
    readonly defaultTimeout: number;
    /**
     * Maximum number of concurrent commands
     */
    readonly maxConcurrentCommands: number;
    /**
     * Enable command retries
     */
    readonly enableRetries: boolean;
    /**
     * Maximum retry attempts
     */
    readonly maxRetries: number;
    /**
     * Retry delay in milliseconds
     */
    readonly retryDelay: number;
    /**
     * Custom configuration properties
     */
    readonly [key: string]: any;
}
/**
 * Command bus events
 */
export interface ICommandBusEvents {
    /**
     * Fired when a command is registered
     */
    'handler:registered': HandlerRegisteredEvent;
    /**
     * Fired when a handler is unregistered
     */
    'handler:unregistered': HandlerUnregisteredEvent;
    /**
     * Fired when a command execution starts
     */
    'command:started': CommandStartedEvent;
    /**
     * Fired when a command execution completes
     */
    'command:completed': CommandCompletedEvent;
    /**
     * Fired when a command execution fails
     */
    'command:failed': CommandFailedEvent;
    /**
     * Fired when middleware is added
     */
    'middleware:added': MiddlewareAddedEvent;
    /**
     * Fired when interceptor is added
     */
    'interceptor:added': InterceptorAddedEvent;
}
/**
 * Handler registered event
 */
export interface HandlerRegisteredEvent {
    readonly commandType: string;
    readonly handlerName: string;
    readonly timestamp: Date;
}
/**
 * Handler unregistered event
 */
export interface HandlerUnregisteredEvent {
    readonly commandType: string;
    readonly handlerName: string;
    readonly timestamp: Date;
}
/**
 * Command started event
 */
export interface CommandStartedEvent {
    readonly commandType: string;
    readonly executionId: string;
    readonly timestamp: Date;
}
/**
 * Command completed event
 */
export interface CommandCompletedEvent {
    readonly commandType: string;
    readonly executionId: string;
    readonly executionTime: number;
    readonly timestamp: Date;
}
/**
 * Command failed event
 */
export interface CommandFailedEvent {
    readonly commandType: string;
    readonly executionId: string;
    readonly error: Error;
    readonly timestamp: Date;
}
/**
 * Middleware added event
 */
export interface MiddlewareAddedEvent {
    readonly middlewareName: string;
    readonly priority: number;
    readonly timestamp: Date;
}
/**
 * Interceptor added event
 */
export interface InterceptorAddedEvent {
    readonly interceptorName: string;
    readonly timestamp: Date;
}
//# sourceMappingURL=command-bus.interface.d.ts.map