/**
 * Get Entity Relationships Query Handler
 */
import { IQueryHandler } from '@nestjs/cqrs';
export declare class GetEntityRelationshipsQuery {
    readonly entityId: string;
    readonly options?: {
        depth?: number;
        includeMetadata?: boolean;
    } | undefined;
    constructor(entityId: string, options?: {
        depth?: number;
        includeMetadata?: boolean;
    } | undefined);
}
export declare class GetEntityRelationshipsHandler implements IQueryHandler<GetEntityRelationshipsQuery> {
    private readonly logger;
    execute(query: GetEntityRelationshipsQuery): Promise<any>;
}
//# sourceMappingURL=GetEntityRelationshipsHandler.d.ts.map