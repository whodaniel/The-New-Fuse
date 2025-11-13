import { BaseCommand, ICommandHandler, ICommandContext, ICommandResult } from '@the-new-fuse/commands-core';
/**
 * VS Code Server Start Command
 */
export declare class VSCodeServerStartCommand extends BaseCommand {
    readonly name?: string | undefined;
    readonly workspace?: string | undefined;
    readonly authProvider: 'github' | 'microsoft';
    readonly port?: number | undefined;
    readonly background: boolean;
    readonly verbose: boolean;
    readonly type = "dev:vscode-server:start";
    constructor(name?: string | undefined, workspace?: string | undefined, authProvider?: 'github' | 'microsoft', port?: number | undefined, background?: boolean, verbose?: boolean);
    execute(context: ICommandContext): Promise<any>;
}
/**
 * VS Code Server Stop Command
 */
export declare class VSCodeServerStopCommand extends BaseCommand {
    readonly name?: string | undefined;
    readonly stopAll: boolean;
    readonly type = "dev:vscode-server:stop";
    constructor(name?: string | undefined, stopAll?: boolean);
    execute(context: ICommandContext): Promise<any>;
}
/**
 * VS Code Server Status Command
 */
export declare class VSCodeServerStatusCommand extends BaseCommand {
    readonly type = "dev:vscode-server:status";
    execute(context: ICommandContext): Promise<any>;
}
/**
 * VS Code Server List Command
 */
export declare class VSCodeServerListCommand extends BaseCommand {
    readonly type = "dev:vscode-server:list";
    execute(context: ICommandContext): Promise<any>;
}
/**
 * VS Code Server Start Handler
 */
export declare class VSCodeServerStartHandler implements ICommandHandler<VSCodeServerStartCommand, any> {
    handle(command: VSCodeServerStartCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
}
/**
 * VS Code Server Stop Handler
 */
export declare class VSCodeServerStopHandler implements ICommandHandler<VSCodeServerStopCommand, any> {
    handle(command: VSCodeServerStopCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
}
/**
 * VS Code Server Status Handler
 */
export declare class VSCodeServerStatusHandler implements ICommandHandler<VSCodeServerStatusCommand, any> {
    handle(command: VSCodeServerStatusCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    catch(error: any): {
        success: boolean;
        error: {
            code: string;
            message: string;
            type: any;
        };
        metadata: {
            executionTime: number;
            completedAt: Date;
            eventCount: number;
        };
        events: never[];
    };
}
/**
 * VS Code Server List Handler
 */
export declare class VSCodeServerListHandler implements ICommandHandler<VSCodeServerListCommand, any> {
    handle(command: VSCodeServerListCommand, context: ICommandContext): Promise<ICommandResult<any>>;
}
//# sourceMappingURL=vscode-server-command.d.ts.map