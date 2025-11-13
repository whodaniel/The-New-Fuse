import { CategoryCommand } from './base.js';
import { Command } from 'commander';
/**
 * Deploy category command implementation
 */
export declare class DeployCommand extends CategoryCommand {
    constructor(program: Command);
    private initializeSubcommands;
}
/**
 * Register the deploy category command
 */
export declare function registerDeployCommands(program: Command): Command;
//# sourceMappingURL=deploy.d.ts.map