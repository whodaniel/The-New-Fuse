import { BaseCommand, ICommandHandler, ICommandContext, ICommandResult, HandlerMetadata } from '@the-new-fuse/commands-core';
/**
 * Modular Branch Switch Command
 */
export declare class ModularBranchSwitchCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Modular Feature Enable Command
 */
export declare class ModularFeatureEnableCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Modular Feature Disable Command
 */
export declare class ModularFeatureDisableCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Modular Status Command
 */
export declare class ModularStatusCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
export declare class ModularBranchSwitchHandler implements ICommandHandler<any, any> {
    handle(command: ModularBranchSwitchCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class ModularFeatureEnableHandler implements ICommandHandler<any, any> {
    handle(command: ModularFeatureEnableCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class ModularFeatureDisableHandler implements ICommandHandler<any, any> {
    handle(command: ModularFeatureDisableCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class ModularStatusHandler implements ICommandHandler<any, any> {
    handle(command: ModularStatusCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
//# sourceMappingURL=modular-commands.d.ts.map