import * as vscode from 'vscode';
/**
 * Command Registry for The New Fuse Extension
 *
 * This class centralizes command registration and management.
 * It makes discoverability easier, provides documentation,
 * and reduces duplication across the extension.
 */
export declare class CommandRegistry {
    private static instance;
    private logger;
    private commands;
    private registeredDisposables;
    private constructor();
    /**
     * Get the singleton instance
     */
    static getInstance(): CommandRegistry;
    /**
     * Register a command
     *
     * @param commandId The ID of the command
     * @param handler The function to execute when the command is invoked
     * @param description A description of what the command does
     * @param category The category for grouping commands
     */
    registerCommand(commandId: string, handler: (...args: any[]) => any, description: string, category: string): void;
    /**
     * Register all commands with VS Code
     *
     * @param context The extension context
     */
    registerCommandsWithVSCode(context: vscode.ExtensionContext): void;
    /**
     * Get all registered commands
     */
    getAllCommands(): Map<string, {
        handler: (...args: any[]) => any;
        description: string;
        category: string;
    }>;
    /**
     * Get commands by category
     *
     * @param category The category to filter by
     */
    getCommandsByCategory(category: string): Map<string, {
        handler: (...args: any[]) => any;
        description: string;
        category: string;
    }>;
    /**
     * Generate markdown documentation for all commands
     */
    generateCommandDocumentation(): string;
    /**
     * Show a command palette that lists all extension commands
     */
    showCommandPalette(): Promise<void>;
    /**
     * Dispose of all registered commands
     */
    dispose(): void;
}
/**
 * Create a command registry instance
 */
export declare function createCommandRegistry(context: vscode.ExtensionContext): CommandRegistry;
//# sourceMappingURL=command-registry.d.ts.map