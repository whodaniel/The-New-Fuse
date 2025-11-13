import { BaseCommand, ICommandHandler, ICommandContext, ICommandResult, HandlerMetadata } from '@the-new-fuse/commands-core';
/**
 * Agent Catalog Ingest Command - Load agent catalog into vector DB
 */
export declare class AgentCatalogIngestCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Agent Search Command - Search for agents semantically
 */
export declare class AgentSearchCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Agent Recommend Command - Get agent recommendations for a task
 */
export declare class AgentRecommendCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Command Handlers
 */
export declare class AgentCatalogIngestHandler implements ICommandHandler<any, any> {
    handle(command: AgentCatalogIngestCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class AgentSearchHandler implements ICommandHandler<any, any> {
    handle(command: AgentSearchCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class AgentRecommendHandler implements ICommandHandler<any, any> {
    handle(command: AgentRecommendCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class AgentTeamBuildHandler implements ICommandHandler<any, any> {
    handle(command: AgentTeamBuildCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class AgentListCategoriesHandler implements ICommandHandler<any, any> {
    handle(command: AgentListCategoriesCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
export declare class AgentStatsHandler implements ICommandHandler<any, any> {
    handle(command: AgentStatsCommand, context: ICommandContext): Promise<ICommandResult<any>>;
    canHandle(command: any): boolean;
    getMetadata(): HandlerMetadata;
}
//# sourceMappingURL=agent-catalog-commands.d.ts.map