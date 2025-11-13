import type { IEmbeddingProvider } from '../interface/vector-database.interface';
/**
 * PrismaVectorService - Integration layer between Prisma and pgvector
 * Provides high-level API for vector operations using Prisma models
 */
export declare class PrismaVectorService {
    private readonly embeddingProvider;
    private readonly logger;
    private prisma;
    constructor(embeddingProvider: IEmbeddingProvider);
    /**
     * Store a memory with automatic embedding generation
     */
    storeMemory(params: {
        agentId?: string;
        content: string;
        metadata?: any;
        namespace?: string;
        importance?: number;
        memoryType?: string;
        tags?: string[];
        category?: string;
        expiresAt?: Date;
    }): Promise<any>;
    /**
     * Search memories using semantic similarity
     */
    searchMemories(params: {
        queryText: string;
        agentId?: string;
        namespace?: string;
        memoryType?: string;
        topK?: number;
        threshold?: number;
    }): Promise<any[]>;
    memories: any;
    matching: any;
    query: any;
}
//# sourceMappingURL=prisma-vector.service.d.ts.map