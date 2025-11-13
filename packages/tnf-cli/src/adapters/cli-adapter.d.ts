import { Command } from 'commander';
import { ICommandBus, CommandRegistry } from '@the-new-fuse/commands-core';
/**
 * CLI Adapter that bridges unified commands with Commander.js
 */
export declare class CLIAdapter {
    private commandBus;
    private configManager;
    private logger;
    private program;
    constructor(commandBus: ICommandBus, program: Command);
    /**
     * Register all unified commands as CLI subcommands
     */
    registerCommands(): void;
    /**
     * Create a CLI command from a unified command definition
     */
    createCLICommand(commandType: string, metadata: any, registry: CommandRegistry): Command;
    /**
     * Create command data from CLI arguments and options
     */
    private createCommandData;
    /**
     * Create unified command instance
     */
    private createUnifiedCommand;
    /**
     * Create execution context with CLI-specific data
     */
    private createExecutionContext;
}
//# sourceMappingURL=cli-adapter.d.ts.map