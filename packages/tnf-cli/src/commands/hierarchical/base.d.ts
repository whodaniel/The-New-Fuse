import { BaseCommand } from '@the-new-fuse/commands-core';
import { Command } from 'commander';
/**
 * Base class for hierarchical CLI commands that bridges Commander.js and commands-core
 */
export declare abstract class HierarchicalCommand extends BaseCommand<any, any> {
    protected program: Command;
    protected spinner: ora.Ora;
    constructor(commandType: string, description: string, category: string, program: Command);
    /**
     * Create a subcommand with the given name and description
     */
    protected createSubcommand(name: string, description: string): Command;
    /**
     * Add common options to a command
     */
    protected addCommonOptions(command: Command): Command;
    /**
     * Handle command execution with proper error handling and output formatting
     */
    protected executeWithHandling<T>(operation: () => Promise<T>, successMessage?: string, errorMessage?: string): Promise<T>;
    /**
     * Format output based on options
     */
    protected formatOutput(data: any, options: any): void;
    /**
     * Display formatted output (override in subclasses)
     */
    protected displayOutput(data: any, options: any): void;
    /**
     * Validate command options
     */
    protected validateOptions(options: any): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Get configuration value
     */
    protected getConfig(key: string, defaultValue?: any): Promise<any>;
    /**
     * Set configuration value
     */
    protected setConfig(key: string, value: any): Promise<void>;
}
/**
 * Base class for subcommands within categories
 */
export declare abstract class SubcommandCommand extends HierarchicalCommand {
    protected parentCategory: string;
    protected subcommandName: string;
    constructor(parentCategory: string, subcommandName: string, description: string, program: Command);
}
//# sourceMappingURL=base.d.ts.map