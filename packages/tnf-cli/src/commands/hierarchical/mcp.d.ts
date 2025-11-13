import { CategoryCommand } from './base.js';
import { Command } from 'commander';
/**
 * MCP category command implementation
 */
export declare class MCPCommand extends CategoryCommand {
    constructor(program: Command);
    private initializeSubcommands;
}
/**
 * Register the MCP category command
 */
export declare function registerMCPCommands(program: Command): Command;
//# sourceMappingURL=mcp.d.ts.map