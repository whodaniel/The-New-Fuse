import { ICommandHandler, ICommandHandlerFactory, HandlerMetadata, FactoryMetadata } from '../interfaces';
/**
 * Registry for command handlers and factories
 */
export declare class CommandRegistry {
    private handlers;
    private factories;
    private metadata;
    /**
     * Register a command handler
     */
    register<TData, TResult>(commandType: string, handler: ICommandHandler<TData, TResult>): void;
    /**
     * Unregister a command handler
     */
    unregister(commandType: string): boolean;
    /**
     * Get a command handler
     */
    getHandler<TData, TResult>(commandType: string): ICommandHandler<TData, TResult> | undefined;
    /**
     * Get a command handler factory
     */
    getFactory<TData, TResult>(commandType: string): ICommandHandlerFactory<TData, TResult> | undefined;
    /**
     * Create a handler using a factory
     */
    createHandler<TData, TResult>(commandType: string): ICommandHandler<TData, TResult> | undefined;
    /**
     * Check if a handler is registered for a command type
     */
    hasHandler(commandType: string): boolean;
    /**
     * Check if a factory is registered for a command type
     */
    hasFactory(commandType: string): boolean;
    /**
     * Check if either a handler or factory is registered for a command type
     */
    has(commandType: string): boolean;
    /**
     * Get metadata for a registered handler or factory
     */
    getMetadata(commandType: string): HandlerMetadata | FactoryMetadata | undefined;
    /**
     * Get all registered command types
     */
    getCommandTypes(): string[];
    /**
     * Get all registered handlers
     */
    getHandlers(): Map<string, RegisteredHandler>;
    /**
     * Get all registered factories
     */
    getFactories(): Map<string, RegisteredFactory>;
    /**
     * Find handlers by category
     */
    findByCategory(category: string): string[];
    /**
     * Find handlers by tags
     */
    findByTag(tag: string): string[];
    /**
     * Find handlers by multiple tags (all tags must be present)
     */
    findByTags(tags: string[]): string[];
    /**
     * Search handlers by name or description
     */
    search(query: string): string[];
    /**
     * Get registry statistics
     */
    getStats(): RegistryStats;
    /**
     * Clear all registered handlers and factories
     */
    clear(): void;
    /**
     * Get registration times for all registered items
     */
    private getRegistrationTimes;
    /**
     * Validate registry state
     */
    validate(): RegistryValidationResult;
    for(: any, [commandType, registered]: [any, any], of: any, this: any, factories: any): void;
}
//# sourceMappingURL=command-registry.d.ts.map