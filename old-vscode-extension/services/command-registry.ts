import * as vscode from 'vscode';
import { getLogger,  Logger  } from '../core/logging.js';

/**
 * Command Registry for The New Fuse Extension
 * 
 * This class centralizes command registration and management.
 * It makes discoverability easier, provides documentation,
 * and reduces duplication across the extension.
 */
export class CommandRegistry {
    private static instance: CommandRegistry;
    private logger: Logger;
    private commands: Map<string, {
        handler: (...args: any[]) => any;
        description: string;
        category: string;
    }> = new Map();
    private registeredDisposables: vscode.Disposable[] = [];
    
    private constructor() {
        this.logger = Logger.getInstance();
    }
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): CommandRegistry {
        if (!CommandRegistry.instance) {
            CommandRegistry.instance = new CommandRegistry();
        }
        return CommandRegistry.instance;
    }
    
    /**
     * Register a command
     * 
     * @param commandId The ID of the command
     * @param handler The function to execute when the command is invoked
     * @param description A description of what the command does
     * @param category The category for grouping commands
     */
    public registerCommand(
        commandId: string,
        handler: (...args: any[]) => any,
        description: string,
        category: string
    ): void {
        // Store the command details
        this.commands.set(commandId, {
            handler,
            description,
            category
        });
        
        // Register with VS Code
        this.logger.info(`Registering command: ${commandId}`);
    }
    
    /**
     * Register all commands with VS Code
     * 
     * @param context The extension context
     */
    public registerCommandsWithVSCode(context: vscode.ExtensionContext): void {
        for (const [commandId, command] of this.commands.entries()) {
            const disposable = vscode.commands.registerCommand(commandId, command.handler);
            this.registeredDisposables.push(disposable);
            context.subscriptions.push(disposable);
            this.logger.info(`Registered command with VS Code: ${commandId}`);
        }
    }
    
    /**
     * Get all registered commands
     */
    public getAllCommands(): Map<string, { 
        handler: (...args: any[]) => any; 
        description: string; 
        category: string; 
    }> {
        return this.commands;
    }
    
    /**
     * Get commands by category
     * 
     * @param category The category to filter by
     */
    public getCommandsByCategory(category: string): Map<string, { 
        handler: (...args: any[]) => any; 
        description: string; 
        category: string; 
    }> {
        const filteredCommands = new Map();
        
        for (const [commandId, command] of this.commands.entries()) {
            if (command.category === category) {
                filteredCommands.set(commandId, command);
            }
        }
        
        return filteredCommands;
    }
    
    /**
     * Generate markdown documentation for all commands
     */
    public generateCommandDocumentation(): string {
        let documentation = '# The New Fuse Extension Commands\n\n';
        
        // Group commands by category
        const categorizedCommands = new Map<string, Array<{
            commandId: string;
            description: string;
        }>>();
        
        for (const [commandId, command] of this.commands.entries()) {
            if (!categorizedCommands.has(command.category)) {
                categorizedCommands.set(command.category, []);
            }
            
            categorizedCommands.get(command.category)?.push({
                commandId,
                description: command.description
            });
        }
        
        // Generate documentation for each category
        for (const [category, commands] of categorizedCommands.entries()) {
            documentation += `## ${category}\n\n`;
            
            for (const command of commands) {
                documentation += `### \`${command.commandId}\`\n\n`;
                documentation += `${command.description}\n\n`;
            }
        }
        
        return documentation;
    }
    
    /**
     * Show a command palette that lists all extension commands
     */
    public async showCommandPalette(): Promise<void> {
        const commandItems = Array.from(this.commands.entries()).map(([commandId, command]) => ({
            label: commandId.replace('thefuse.', ''),
            description: command.category,
            detail: command.description,
            commandId
        }));
        
        const selectedCommand = await vscode.window.showQuickPick(commandItems, {
            placeHolder: 'Select a New Fuse command to execute',
            matchOnDescription: true,
            matchOnDetail: true
        });
        
        if (selectedCommand) {
            vscode.commands.executeCommand(selectedCommand.commandId);
        }
    }
    
    /**
     * Dispose of all registered commands
     */
    public dispose(): void {
        this.registeredDisposables.forEach(d => d.dispose());
        this.registeredDisposables = [];
    }
}

/**
 * Create a command registry instance
 */
export function createCommandRegistry(context: vscode.ExtensionContext): CommandRegistry {
    const registry = CommandRegistry.getInstance();
    
    // Register the command palette command
    registry.registerCommand(
        'thefuse.showCommandPalette',
        () => registry.showCommandPalette(),
        'Show a list of all The New Fuse commands',
        'Core'
    );
    
    // Core commands
    registry.registerCommand(
        'thefuse.showConnectionStatus',
        () => {
            const { ChromeExtensionHandler } = require('../services/chrome-extension-handler');
            const chromeHandler = ChromeExtensionHandler.getInstance();
            const chromeStatus = chromeHandler.getStatus();
            const message = `Chrome Extension: ${chromeStatus}`;
            vscode.window.showInformationMessage(message);
        },
        'Show the status of the Chrome extension connection',
        'Core'
    );
    
    registry.registerCommand(
        'thefuse.showCommunicationPanel',
        () => {
            const { CommunicationPanel } = require('../web-ui/communication-panel');
            CommunicationPanel.createOrShow(context.extensionUri);
        },
        'Show the communication panel for agent interactions',
        'Communication'
    );
    
    // Register all commands with VS Code
    registry.registerCommandsWithVSCode(context);
    
    return registry;
}