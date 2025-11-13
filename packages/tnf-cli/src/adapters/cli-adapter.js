import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ICommandResult } from '@the-new-fuse/commands-core';
import { CLIConfigManager } from '../lib/CLIConfigManager.js';
import { createCommandLogger } from '@the-new-fuse/commands-core';
/**
 * CLI Adapter that bridges unified commands with Commander.js
 */
export class CLIAdapter {
    commandBus;
    configManager;
    logger;
    program;
    constructor(commandBus, program) {
        this.commandBus = commandBus;
        this.program = program;
        this.configManager = new CLIConfigManager();
        this.logger = createCommandLogger('cli-adapter', 'CLIAdapter');
    }
    /**
     * Register all unified commands as CLI subcommands
     */
    registerCommands() {
        const registry = this.commandBus.getRegistry();
        const commandTypes = registry.getCommandTypes();
        this.logger.info('Registering CLI commands from unified architecture', {
            commandCount: commandTypes.length
        });
        // Group commands by category
        const commandsByCategory = this.groupCommandsByCategory(commandTypes, registry);
        // Register commands for each category
        for (const [category, commands] of Object.entries(commandsByCategory)) {
            this.registerCategoryCommands(category, commands, registry);
        }
        // Register legacy compatibility commands
        this.registerLegacyCommands();
    }
    /**
     * Create a CLI command from a unified command definition
     */
    createCLICommand(commandType, metadata, registry) {
        const cliCommand = new Command(commandType);
        // Set basic command info
        cliCommand.description(metadata.description || `Execute ${commandType} command);
    
    // Add version if available
    if (metadata.version) {
      cliCommand.version(metadata.version);
    }

    // Add arguments based on command schema
    this.addCommandArguments(cliCommand, metadata);
    
    // Add options based on command schema
    this.addCommandOptions(cliCommand, metadata);

    // Set up the action handler
    cliCommand.action(async (args: any, options: any) => {
      await this.handleCommandExecution(commandType, args, options, metadata);
    });

    return cliCommand;
  }

  /**
   * Handle command execution with CLI-specific formatting
   */
  private async handleCommandExecution(
    commandType: string,
    args: any,
    options: any,
    metadata: any
  ): Promise<void> {`);
        const spinner = ora(`Executing ${commandType}`, ...).start();
        try {
            // Create command data from CLI args and options
            const commandData = this.createCommandData(args, options, metadata);
            // Create unified command
            const command = this.createUnifiedCommand(commandType, commandData, metadata);
            // Create execution context
            const context = await this.createExecutionContext(options);
            // Execute command
            const result = await this.commandBus.executeWithContext(command, context);
            spinner.stop();
            // Handle result with CLI-specific formatting
            await this.formatAndDisplayResult(result, options);
        }
        catch (error) {
            spinner.fail(chalk.red(Command, $, { commandType }, failed));
            this.displayError(error, options);
            process.exit(1);
        }
    }
    /**
     * Create command data from CLI arguments and options
     */
    createCommandData(args, options, metadata) {
        const data = {};
        // Merge arguments and options
        if (args && typeof args === 'object') {
            Object.assign(data, args);
        }
        if (options && typeof options === 'object') {
            Object.assign(data, options);
        }
        // Add CLI-specific metadata
        data.cli = {
            timestamp: new Date().toISOString(),
            version: metadata.version,
            source: 'tnf-cli'
        };
        return data;
    }
    /**
     * Create unified command instance
     */
    createUnifiedCommand(commandType, data, metadata) {
        return new CLIUnifiedCommand(commandType, data, metadata);
    }
    /**
     * Create execution context with CLI-specific data
     */
    async createExecutionContext(options) {
        const userId = await this.configManager.get('userId') || 'cli-user';
        const sessionId = await this.configManager.get('sessionId') || 'cli-session';
        return {} `
      executionId: cli-${Date.now()}` - $;
        {
            Math.random().toString(36).substr(2, 9);
        }
        userId,
            sessionId,
            timestamp;
        new Date(),
            data;
        {
            cli: true,
                options,
                cwd;
            process.cwd(),
                env;
            process.env;
        }
        auth: {
            isAuthenticated: true,
                roles;
            ['cli-user'],
                permissions;
            ['cli:execute'],
                claims;
            { }
        }
        correlationId: options.correlationId,
            causationId;
        options.causationId;
    }
    ;
}
async;
formatAndDisplayResult(result, ICommandResult, options, any);
Promise < void  > {
    if(result) { }, : .success
};
{
    if (options.json) {
        console.log(JSON.stringify({
            success: true,
            data: result.data,
            metadata: {
                executionTime: result.metadata.executionTime,
                eventCount: result.metadata.eventCount,
                completedAt: result.metadata.completedAt
            }
        }, null, 2));
    }
    else {
        console.log(chalk.green('✅ Command executed successfully'));
        if (result.data) {
            console.log(chalk.blue('\nResult:'));
            this.formatDataDisplay(result.data);
        }
        `
        `;
        if (options.verbose && result.metadata.executionTime) {
            console.log(chalk.gray(nExecution, time, $, { result, : .metadata.executionTime }, ms));
            `
          console.log(chalk.gray(`;
            Events;
            emitted: $;
            {
                result.metadata.eventCount;
            }
            ;
        }
    }
}
{
    if (options.json) {
        console.log(JSON.stringify({
            success: false,
            error: result.error,
            metadata: result.metadata
        }, null, 2));
    }
    else {
        console.log(chalk.red('❌ Command failed'));
        `
        if (result.error) {`;
        console.log(chalk.red(Error, $, { result, : .error.message } `));
          if (options.verbose && result.error.details) {
            console.log(chalk.gray('Details:'), result.error.details);
          }
        }
      }
    }
  }

  /**
   * Format data for CLI display
   */
  private formatDataDisplay(data: any, indent = 0): void {
    const prefix = '  '.repeat(indent);
    
    if (data === null || data === undefined) {
      console.log(prefix + chalk.gray('null'));
      return;
    }
    
    if (typeof data === 'string') {
      console.log(prefix + data);
      return;
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      console.log(prefix + chalk.cyan(String(data)));
      return;
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.log(prefix + chalk.gray('[]'));
        return;
      }
      
      data.forEach((item, index) => {
        console.log(prefix + chalk.yellow(${index + 1}.));
        this.formatDataDisplay(item, indent + 1);
      });
      return;
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        console.log(prefix + chalk.gray('{}'));
        return;
      }
      
      keys.forEach(key => {
        console.log(prefix + chalk.blue(${key}:));
        this.formatDataDisplay(data[key], indent + 1);
      });
      return;
    }
  }

  /**
   * Display error with CLI formatting
   */
  private displayError(error: Error, options: any): void {
    if (options.json) {
      console.log(JSON.stringify({
        success: false,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }, null, 2));
    } else {
      console.error(chalk.red('Error:'), error.message);
      if (options.verbose && error.stack) {
        console.error(chalk.gray('Stack trace:'));
        console.error(chalk.gray(error.stack));
      }
    }
  }

  /**
   * Group commands by category
   */
  private groupCommandsByCategory(
    commandTypes: string[],
    registry: CommandRegistry
  ): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};
    
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
   * Register commands for a specific category
   */
  private registerCategoryCommands(
    category: string,
    commands: string[],
    registry: CommandRegistry
  ): void {
    if (commands.length === 0) return;
    
    // Create category command if there are multiple commands
    if (commands.length > 1 || category !== 'general') {
      const categoryCommand = new Command(category);
      categoryCommand.description(${category} commands);
      
      commands.forEach(commandType => {
        const metadata = registry.getMetadata(commandType);
        const cliCommand = this.createCLICommand(commandType, metadata, registry);
        categoryCommand.addCommand(cliCommand);
      });
      
      this.program.addCommand(categoryCommand);
    } else {
      // Register single command directly
      const commandType = commands[0];
      const metadata = registry.getMetadata(commandType);
      const cliCommand = this.createCLICommand(commandType, metadata, registry);
      this.program.addCommand(cliCommand);
    }
  }

  /**
   * Add command arguments based on schema
   */
  private addCommandArguments(cliCommand: Command, metadata: any): void {
    // Add arguments based on command schema
    if (metadata.arguments) {
      metadata.arguments.forEach((arg: any) => {
        cliCommand.argument(
          arg.name,
          arg.description,
          arg.required ? undefined : arg.default
        );
      });
    }
  }

  /**
   * Add command options based on schema
   */
  private addCommandOptions(cliCommand: Command, metadata: any): void {
    // Add common CLI options
    cliCommand
      .option('-j, --json', 'Output in JSON format')
      .option('-v, --verbose', 'Enable verbose output')
      .option('--dry-run', 'Show what would be executed without running');
    
    // Add command-specific options`));
        if (metadata.options) {
            `
      metadata.options.forEach((opt: any) => {`;
            const flags = opt.short ? -$ : , { opt, short };
            --$;
            {
                opt.name;
            }
            --$;
            {
                opt.name;
            }
            `;
        cliCommand.option(
          flags + (opt.value ?  <${opt.value}` > ` : ''),
          opt.description,
          opt.default
        );
      });
    }
  }

  /**
   * Register legacy compatibility commands
   */
  private registerLegacyCommands(): void {
    // Register backward compatibility commands
    
    // Chat command
    const chatCommand = new Command('chat');
    chatCommand
      .alias('c')
      .description('Start interactive chat session')
      .option('-p, --provider <provider>', 'LLM provider')
      .option('-m, --model <model>', 'Specific model to use')
      .option('-v, --verbose', 'Enable verbose output')
      .action(async (options: any) => {
        // Map to unified chat command
        await this.handleCommandExecution('chat.start', {}, options, {
          description: 'Start interactive chat session'
        });
      });
    this.program.addCommand(chatCommand);

    // Exec command
    const execCommand = new Command('exec');
    execCommand
      .alias('x')
      .description('Execute a quick task')
      .argument('<task>', 'Task to execute')
      .option('-p, --provider <provider>', 'LLM provider')
      .option('-m, --model <model>', 'Specific model to use')
      .option('--json', 'Output in JSON format')
      .action(async (task: string, options: any) => {
        await this.handleCommandExecution('task.execute', { task }, options, {
          description: 'Execute a quick task'
        });
      });
    this.program.addCommand(execCommand);
  }
}

/**
 * CLI-specific unified command implementation
 */
class CLIUnifiedCommand extends BaseCommand {
  constructor(
    type: string,
    data: any,
    metadata: any
  ) {
    super(type, data, {
      ...metadata,
      category: metadata.category || 'cli',
      tags: [...(metadata.tags || []), 'cli']
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    // CLI commands are handled by the command bus
    // This method can be overridden for CLI-specific logic
    return this.data;
  }

  protected async validateData(context: ICommandContext): Promise<any[]> {
    // CLI-specific validation
    const errors: any[] = [];
    
    // Add CLI-specific validation logic here
    if (this.data.cli && !this.data.cli.timestamp) {
      errors.push({
        code: 'MISSING_TIMESTAMP',
        message: 'CLI commands must have a timestamp',
        path: 'cli.timestamp'
      });
    }
    
    return errors;
  }
};
        }
    }
}
//# sourceMappingURL=cli-adapter.js.map