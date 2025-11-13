import { BaseCommand, ICommandHandler, ICommandContext, ICommandResult } from '@the-new-fuse/commands-core';
/**
 * MCP Server List Command
 */
export declare class MCPListCommand extends BaseCommand {
    readonly configPath?: string | undefined;
    readonly verbose: boolean;
    readonly type = "mcp:list";
    constructor(configPath?: string | undefined, verbose?: boolean);
    execute(context: ICommandContext): Promise<any>;
}
/**
 * MCP Server Start Command
 */
export declare class MCPStartCommand extends BaseCommand {
    readonly serverName: string;
    readonly background: boolean;
    readonly type = "mcp:start";
    constructor(serverName: string, background?: boolean);
    execute(context: ICommandContext): Promise<any>;
}
/**
 * MCP Server Status Command
 */
export declare class MCPStatusCommand extends BaseCommand {
    readonly type = "mcp:status";
    execute(context: ICommandContext): Promise<any>;
}
/**
 * MCP List Handler
 */
export declare class MCPListHandler implements ICommandHandler<MCPListCommand, any> {
    handle(command: MCPListCommand, context: ICommandContext): Promise<ICommandResult<any>>;
}
//# sourceMappingURL=mcp-commands.d.ts.map