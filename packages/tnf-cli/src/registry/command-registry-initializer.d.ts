import { CommandBus } from '@the-new-fuse/commands-core';
/**
 * Initialize and configure the command registry with all CLI commands
 */
export declare class CommandRegistryInitializer {
    private commandBus;
    constructor();
    /**
     * Initialize the command registry with all handlers
     */
    initialize(): CommandBus;
    /**
     * Get the initialized command bus
     */
    getCommandBus(): CommandBus;
    /**
     * Register core CLI commands
     */
    private registerCoreCommands;
    /**
     * Register agent-related commands
     */
    private registerAgentCommands;
    /**
     * Register configuration commands
     */
    private registerConfigCommands;
    /**
     * Register workspace commands
     */
    private registerWorkspaceCommands;
    /**
     * Register development commands
     */
    private registerDevCommands;
    /**
     * Get command registry statistics
     */
    getStats(): any;
    /**
     * List all registered commands
     */
    listCommands(): string[];
    /**
     * Get commands by category
     */
    getCommandsByCategory(): Record<string, string[]>;
    /**
     * Validate the command registry
     */
    validateRegistry(): any;
}
/**
 * Get the singleton command registry initializer
 */
export declare function getCommandRegistryInitializer(): CommandRegistryInitializer;
/**
 * Initialize and get the command bus
 */
export declare function initializeCommandBus(): CommandBus;
/**
 * Get the initialized command bus
 */
export declare function getCommandBus(): CommandBus;
//# sourceMappingURL=command-registry-initializer.d.ts.map