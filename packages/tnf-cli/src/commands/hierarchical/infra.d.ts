import { CategoryCommand } from './base.js';
import { Command } from 'commander';
/**
 * Infra category command implementation
 */
export declare class InfraCommand extends CategoryCommand {
    constructor(program: Command);
    private initializeSubcommands;
}
/**
 * Register the infra category command
 */
export declare function registerInfraCommands(program: Command): Command;
//# sourceMappingURL=infra.d.ts.map