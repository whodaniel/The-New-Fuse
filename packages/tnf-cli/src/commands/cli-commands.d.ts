import { BaseCommand, ICommandContext } from '@the-new-fuse/commands-core';
/**
 * Chat Start Command
 */
export declare class ChatStartCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Task Execute Command
 */
export declare class TaskExecuteCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Agent List Command
 */
export declare class AgentListCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Agent Run Command
 */
export declare class AgentRunCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
    default: task;
}
/**
 * Config Set Command
 */
export declare class ConfigSetCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Workspace Status Command
 */
export declare class WorkspaceStatusCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
//# sourceMappingURL=cli-commands.d.ts.map