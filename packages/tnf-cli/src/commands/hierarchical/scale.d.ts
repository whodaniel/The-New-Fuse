import { CategoryCommand } from './base.js';
import { Command } from 'commander';
/**
 * Scale category command implementation
 */
export declare class ScaleCommand extends CategoryCommand {
    constructor(program: Command);
    private initializeSubcommands;
}
/**
 * Register the scale category command
 */
export declare function registerScaleCommands(program: Command): Command;
//# sourceMappingURL=scale.d.ts.map