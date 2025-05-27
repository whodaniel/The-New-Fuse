"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
exports.createCommandRegistry = createCommandRegistry;
const vscode = __importStar(require("vscode"));
const logging_1 = require("../core/logging");
/**
 * Command Registry for The New Fuse Extension
 *
 * This class centralizes command registration and management.
 * It makes discoverability easier, provides documentation,
 * and reduces duplication across the extension.
 */
class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.registeredDisposables = [];
        this.logger = logging_1.Logger.getInstance();
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
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
    registerCommand(commandId, handler, description, category) {
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
    registerCommandsWithVSCode(context) {
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
    getAllCommands() {
        return this.commands;
    }
    /**
     * Get commands by category
     *
     * @param category The category to filter by
     */
    getCommandsByCategory(category) {
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
    generateCommandDocumentation() {
        let documentation = '# The New Fuse Extension Commands\n\n';
        // Group commands by category
        const categorizedCommands = new Map();
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
    async showCommandPalette() {
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
    dispose() {
        this.registeredDisposables.forEach(d => d.dispose());
        this.registeredDisposables = [];
    }
}
exports.CommandRegistry = CommandRegistry;
/**
 * Create a command registry instance
 */
function createCommandRegistry(context) {
    const registry = CommandRegistry.getInstance();
    // Register the command palette command
    registry.registerCommand('thefuse.showCommandPalette', () => registry.showCommandPalette(), 'Show a list of all The New Fuse commands', 'Core');
    // Core commands
    registry.registerCommand('thefuse.showConnectionStatus', () => {
        const { ChromeExtensionHandler } = require('../services/chrome-extension-handler');
        const chromeHandler = ChromeExtensionHandler.getInstance();
        const chromeStatus = chromeHandler.getStatus();
        const message = `Chrome Extension: ${chromeStatus}`;
        vscode.window.showInformationMessage(message);
    }, 'Show the status of the Chrome extension connection', 'Core');
    registry.registerCommand('thefuse.showCommunicationPanel', () => {
        const { CommunicationPanel } = require('../web-ui/communication-panel');
        CommunicationPanel.createOrShow(context.extensionUri);
    }, 'Show the communication panel for agent interactions', 'Communication');
    // Register all commands with VS Code
    registry.registerCommandsWithVSCode(context);
    return registry;
}
//# sourceMappingURL=command-registry.js.map