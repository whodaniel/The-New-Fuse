import { BaseCommand, ICommandContext } from '@the-new-fuse/commands-core';
/**
 * Memory Store Command - Store data in vector memory
 */
export declare class MemoryStoreCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
}
/**
 * Memory Search Command - Search vector memory semantically
 */
export declare class MemorySearchCommand extends BaseCommand {
    constructor(data: any);
    protected executeInternal(context: ICommandContext): Promise<any>;
    console: any;
    log(chalk: any, cyan: any): any;
}
//# sourceMappingURL=vector-memory-commands.d.ts.map