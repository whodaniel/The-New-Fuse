"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMemoryConfig = exports.MemoryConfig = void 0;
import zod_1 from 'zod';
exports.MemoryConfig = zod_1.z.object({
    shortTermCapacity: zod_1.z.number().positive().default(100),
    longTermThreshold: zod_1.z.number().positive().default(0.7),
    vectorStoreType: zod_1.z.enum(['pinecone', 'qdrant', 'milvus']).default('pinecone'),
    embeddingModel: zod_1.z.enum(['text-embedding-ada-002', 'all-MiniLM-L6-v2']).default('text-embedding-ada-002'),
    similarityMetric: zod_1.z.enum(['cosine', 'euclidean', 'dot']).default('cosine'),
    chunkSize: zod_1.z.number().positive().default(512),
    chunkOverlap: zod_1.z.number().nonnegative().default(50),
});
exports.defaultMemoryConfig = {
    shortTermCapacity: 100,
    longTermThreshold: 0.7,
    vectorStoreType: 'pinecone',
    embeddingModel: 'text-embedding-ada-002',
    similarityMetric: 'cosine',
    chunkSize: 512,
    chunkOverlap: 50,
};
//# sourceMappingURL=memory_config.js.map