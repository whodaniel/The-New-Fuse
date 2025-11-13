/**
 * Discover Entities Command Handler
 */
import { ICommandHandler } from '@nestjs/cqrs';
export declare class DiscoverEntitiesCommand {
    readonly paths: string[];
    readonly options?: {
        recursive?: boolean;
        includeHidden?: boolean;
        maxDepth?: number;
    } | undefined;
    constructor(paths: string[], options?: {
        recursive?: boolean;
        includeHidden?: boolean;
        maxDepth?: number;
    } | undefined);
}
export declare class DiscoverEntitiesHandler implements ICommandHandler<DiscoverEntitiesCommand> {
    private readonly logger;
    execute(command: DiscoverEntitiesCommand): Promise<any>;
}
//# sourceMappingURL=DiscoverEntitiesHandler.d.ts.map