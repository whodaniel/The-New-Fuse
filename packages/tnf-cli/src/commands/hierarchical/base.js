import { BaseCommand } from '@the-new-fuse/commands-core';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
/**
 * Base class for hierarchical CLI commands that bridges Commander.js and commands-core
 */
export class HierarchicalCommand extends BaseCommand {
    program;
    spinner;
    constructor(commandType, description, category, program) {
        super(commandType, {}, {
            name: commandType,
            description,
            category,
            tags: ['hierarchical', 'cli']
        });
        this.program = program;
        this.spinner = ora();
    }
    /**
     * Create a subcommand with the given name and description
     */
    createSubcommand(name, description) {
        return new Command(name)
            .description(description);
    }
    /**
     * Add common options to a command
     */
    addCommonOptions(command) {
        return command
            .option('-v, --verbose', 'Enable verbose output')
            .option('--json', 'Output in JSON format')
            .option('--no-color', 'Disable colored output');
    }
    /**
     * Handle command execution with proper error handling and output formatting
     */
    async executeWithHandling(operation, successMessage, errorMessage) {
        try {
            this.spinner.start();
            const result = await operation();
            if (successMessage) {
                this.spinner.succeed(chalk.green(successMessage));
            }
            else {
                this.spinner.stop();
            }
            return result;
        }
        catch (error) {
            this.spinner.fail(chalk.red(errorMessage || 'Command failed'));
            throw error;
        }
    }
    /**
     * Format output based on options
     */
    formatOutput(data, options) {
        if (options.json) {
            console.log(JSON.stringify(data, null, 2));
        }
        else {
            this.displayOutput(data, options);
        }
    }
    /**
     * Display formatted output (override in subclasses)
     */
    displayOutput(data, options) {
        console.log(data);
    }
    /**
     * Validate command options
     */
    validateOptions(options) {
        const errors = [];
        // Common validation logic
        if (options.port && isNaN(parseInt(options.port))) {
            errors.push('Port must be a valid number');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Get configuration value
     */
    async getConfig(key, defaultValue) {
        // This would integrate with the existing CLIConfigManager
        try {
            const { CLIConfigManager } = await import('../lib/CLIConfigManager.js');
            const configManager = new CLIConfigManager();
            return await configManager.get(key) || defaultValue;
        }
        catch {
            return defaultValue;
        }
    }
    /**
     * Set configuration value
     */
    async setConfig(key, value) {
        try {
            const { CLIConfigManager } = await import('../lib/CLIConfigManager.js');
            const configManager = new CLIConfigManager();
            await configManager.set(key, value);
        }
        catch (error) {
            console.warn(chalk.yellow(`Warning: Could not save configuration: ${error.message}));
    }
  }
}

/**
 * Base class for category commands (dev, run, agent, workflow)
 */
export abstract class CategoryCommand extends HierarchicalCommand {
  protected subcommands: Map<string, Command> = new Map();

  constructor(
    category: string,
    description: string,
    program: Command
  ) {
    super(category, description, category, program);
  }

  /**
   * Register a subcommand
   */
  protected registerSubcommand(name: string, command: Command): void {
    this.subcommands.set(name, command);
    this.program.addCommand(command);
  }

  /**
   * Get all registered subcommands
   */
  public getSubcommands(): Map<string, Command> {
    return new Map(this.subcommands);
  }

  /**
   * Create the main category command
   */
  public createCategoryCommand(): Command {
    const categoryCommand = new Command(this.type)`
                .description(this.metadata.description || `${this.type}`, operations)));
            // Add all registered subcommands
            for (const [name, command] of this.subcommands) {
                categoryCommand.addCommand(command);
            }
            return categoryCommand;
        }
    }
}
/**
 * Base class for subcommands within categories
 */
export class SubcommandCommand extends HierarchicalCommand {
    parentCategory;
    subcommandName;
    constructor(parentCategory, subcommandName, description, program) {
        super($, { parentCategory }, $, { subcommandName } `,
      description,
      parentCategory,
      program
    );
    
    this.parentCategory = parentCategory;
    this.subcommandName = subcommandName;
  }

  /**
   * Create the subcommand with proper configuration
   */
  public createSubcommand(): Command {
    let command = this.createSubcommand(this.subcommandName, this.metadata.description || '');
    
    // Add common options
    command = this.addCommonOptions(command);
    
    // Add subcommand-specific options
    command = this.addSpecificOptions(command);
    
    // Set the action handler
    command.action(async (options, ...args) => {
      await this.handleCommand(options, ...args);
    });
    
    return command;
  }

  /**
   * Add subcommand-specific options (override in subclasses)
   */
  protected addSpecificOptions(command: Command): Command {
    return command;
  }

  /**
   * Handle the command execution (override in subclasses)
   */
  protected abstract handleCommand(options: any, ...args: any[]): Promise<void>;

  /**
   * Validate arguments for the subcommand
   */
  protected validateArguments(args: any[]): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }
});
    }
}
//# sourceMappingURL=base.js.map