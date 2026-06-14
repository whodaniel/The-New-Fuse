import { VectorDatabaseService } from '@the-new-fuse/core-vector-db';
import { TNFResourcePointer } from './signature-wrapper.js';
export declare class PointerResolverService {
    private readonly vectorDbService;
    private static readonly serviceName;
    private readonly logger;
    constructor(vectorDbService: VectorDatabaseService);
    /**
     * Resolves a TNF Resource Pointer (TRP) to its actual content.
     * This prevents "All-in-Memory" bottlenecks by fetching data only when needed.
     */
    resolve(pointer: TNFResourcePointer): Promise<any>;
    private resolvePgVector;
    private resolveFile;
    private resolveTrp;
}
