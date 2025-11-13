import { CategoryCommand } from './base.js';
import { Command } from 'commander';
/**
 * Workflow category command implementation
 */
export declare class WorkflowCommand extends CategoryCommand {
    constructor(program: Command);
    private initializeSubcommands;
}
/**
 * Register the workflow category command
 */
export declare function registerWorkflowCommands(program: Command): Command;
//# sourceMappingURL=workflow.d.ts.map