import { createCommandBus } from '@the-new-fuse/commands-core';
import { ChatStartHandler, TaskExecuteHandler, AgentListHandler, AgentRunHandler, ConfigSetHandler, ConfigGetHandler, WorkspaceInitHandler, WorkspaceStatusHandler } from '../commands/cli-commands.js';
/**
 * Initialize and configure the command registry with all CLI commands
 */
export class CommandRegistryInitializer {
    commandBus;
    constructor() {
        this.commandBus = createCommandBus({
            enableValidation: true,
            enableLogging: true,
            enableMetrics: true,
            defaultTimeout: 30000,
            maxConcurrentCommands: 10
        });
    }
    /**
     * Initialize the command registry with all handlers
     */
    initialize() {
        this.registerCoreCommands();
        this.registerAgentCommands();
        this.registerConfigCommands();
        this.registerWorkspaceCommands();
        this.registerDevCommands();
        return this.commandBus;
    }
    /**
     * Get the initialized command bus
     */
    getCommandBus() {
        return this.commandBus;
    }
    /**
     * Register core CLI commands
     */
    registerCoreCommands() {
        // Chat commands
        this.commandBus.register('chat.start', new ChatStartHandler());
        // Task commands
        this.commandBus.register('task.execute', new TaskExecuteHandler());
    }
    /**
     * Register agent-related commands
     */
    registerAgentCommands() {
        this.commandBus.register('agent.list', new AgentListHandler());
        this.commandBus.register('agent.run', new AgentRunHandler());
    }
    /**
     * Register configuration commands
     */
    registerConfigCommands() {
        this.commandBus.register('config.set', new ConfigSetHandler());
        this.commandBus.register('config.get', new ConfigGetHandler());
    }
    /**
     * Register workspace commands
     */
    registerWorkspaceCommands() {
        this.commandBus.register('workspace.init', new WorkspaceInitHandler());
        this.commandBus.register('workspace.status', new WorkspaceStatusHandler());
    }
    /**
     * Register development commands
     */
    registerDevCommands() {
        const { VSCodeServerStartHandler, VSCodeServerStopHandler, VSCodeServerStatusHandler, VSCodeServerListHandler } = require('../commands/vscode-server-command.js');
        this.commandBus.register('dev:vscode-server:start', new VSCodeServerStartHandler());
        this.commandBus.register('dev:vscode-server:stop', new VSCodeServerStopHandler());
        this.commandBus.register('dev:vscode-server:status', new VSCodeServerStatusHandler());
        this.commandBus.register('dev:vscode-server:list', new VSCodeServerListHandler());
    }
    /**
     * Get command registry statistics
     */
    getStats() {
        return this.commandBus.getStats();
    }
    /**
     * List all registered commands
     */
    listCommands() {
        const registry = this.commandBus.getRegistry();
        return registry.getCommandTypes();
    }
    /**
     * Get commands by category
     */
    getCommandsByCategory() {
        const registry = this.commandBus.getRegistry();
        const commandTypes = registry.getCommandTypes();
        const grouped = {};
        commandTypes.forEach(commandType => {
            const metadata = registry.getMetadata(commandType);
            const category = metadata?.category || 'general';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(commandType);
        });
        return grouped;
    }
    /**
     * Validate the command registry
     */
    validateRegistry() {
        const registry = this.commandBus.getRegistry();
        return registry.validate();
    }
}
/**
 * Singleton instance for the command registry initializer
 */
let registryInitializer = null;
/**
 * Get the singleton command registry initializer
 */
export function getCommandRegistryInitializer() {
    if (!registryInitializer) {
        registryInitializer = new CommandRegistryInitializer();
    }
    return registryInitializer;
}
/**
 * Initialize and get the command bus
 */
export function initializeCommandBus() {
    const initializer = getCommandRegistryInitializer();
    return initializer.initialize();
}
/**
 * Get the initialized command bus
 */
export function getCommandBus() {
    const initializer = getCommandRegistryInitializer();
    const bus = initializer.getCommandBus();
    if (!bus) {
        throw new Error('Command bus not initialized. Call initializeCommandBus() first.');
    }
    return bus;
}
//# sourceMappingURL=command-registry-initializer.js.map