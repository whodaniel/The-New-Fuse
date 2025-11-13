import { ICommand, ICommandContext, ICommandResult, ICommandHandler, ICommandHandlerFactory, ICommandMiddleware, ICommandInterceptor, ICommandBus, CommandBusStats, ICommandBusConfig } from './interfaces';
import { CommandRegistry } from './registry';
import { ExecutionEngine } from './engine';
import { CommandErrorHandler } from './errors';
import { Logger } from './logging';
/**
 * Default command bus implementation
 */
export declare class CommandBus implements ICommandBus {
    private registry;
    private engine;
    private errorHandler;
    private logger;
    private config;
    constructor(config?: Partial<ICommandBusConfig>);
    /**
     * Execute a command
     */
    execute<TData, TResult>(command: ICommand<TData, TResult>): Promise<ICommandResult<TResult>>;
    /**
     * Execute a command with custom context
     */
    executeWithContext<TData, TResult>(command: ICommand<TData, TResult>, context: ICommandContext): Promise<ICommandResult<TResult>>;
    /**
     * Register a command handler
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
     * Check if a handler is registered
     */
    hasHandler(commandType: string): boolean;
    /**
     * Get a handler
     */
    getHandler<TData, TResult>(commandType: string): ICommandHandler<TData, TResult> | undefined;
    /**
     * Set middleware
     */
    use(middleware: ICommandMiddleware): void;
    /**
     * Set interceptor
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
    /**
     * Get configuration
     */
    getConfig(): ICommandBusConfig;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ICommandBusConfig>): void;
    /**
     * Get the registry
     */
    getRegistry(): CommandRegistry;
    /**
     * Get the execution engine
     */
    getEngine(): ExecutionEngine;
    /**
     * Get the error handler
     */
    getErrorHandler(): CommandErrorHandler;
    /**
     * Get the logger
     */
    getLogger(): Logger;
    /**
     * Create execution context
     */
    private createContext;
    /**
     * Setup event listeners
     */
    private setupEventListeners;
}
/**
 * Create a default command bus instance
 */
export declare function createCommandBus(config?: Partial<ICommandBusConfig>): CommandBus;
/**
 * Create a command bus with default middleware
 */
export declare function createCommandBusWithDefaults(config?: Partial<ICommandBusConfig>): CommandBus;
/**
 * Default logging middleware
 */
export declare class LoggingMiddleware implements ICommandMiddleware {
    readonly name = "logging";
    readonly priority = 1000;
    execute(command: ICommand, context: ICommandContext, next: () => Promise<ICommandResult>): Promise<ICommandResult>;
}
/**
 * Default validation middleware
 */
export declare class ValidationMiddleware implements ICommandMiddleware {
    readonly name = "validation";
    readonly priority = 100;
    execute(command: ICommand, context: ICommandContext, next: () => Promise<ICommandResult>): Promise<ICommandResult>;
}
/**
 * Default metrics middleware
 */
export declare class MetricsMiddleware implements ICommandMiddleware {
    readonly name = "metrics";
    readonly priority = 900;
    execute(command: ICommand, context: ICommandContext, next: () => Promise<ICommandResult>): Promise<ICommandResult>;
}
/**
 * Default performance interceptor
 */
export declare class PerformanceInterceptor implements ICommandInterceptor {
    readonly name = "performance";
    beforeExecute(command: ICommand, context: ICommandContext): Promise<void>;
    afterExecute(command: ICommand, context: ICommandContext, result: ICommandResult): Promise<void>;
}
//# sourceMappingURL=command-bus.d.ts.map