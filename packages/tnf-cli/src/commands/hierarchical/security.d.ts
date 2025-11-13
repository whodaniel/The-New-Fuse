import { CategoryCommand } from './base.js';
import { Command } from 'commander';
/**
 * Security category command implementation
 */
export declare class SecurityCommand extends CategoryCommand {
    constructor(program: Command);
    private initializeSubcommands;
}
/**
 * Register the security category command
 */
export declare function registerSecurityCommands(program: Command): Command;
//# sourceMappingURL=security.d.ts.map