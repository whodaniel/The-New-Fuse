import { z } from 'zod';

export const MemoryConfig = z.object({
  shortTermCapacity: z.number().positive().default(100),
  longTermThreshold: z.number().positive().default(0.7),
  vectorStoreType: z.enum(['pinecone', 'qdrant', 'milvus']).default('pinecone'),
  embeddingModel: z.enum(['text-embedding-ada-002', 'all-MiniLM-L6-v2']).default('text-embedding-ada-002'),
  similarityMetric: z.enum(['cosine', 'euclidean', 'dot']).default('cosine'),
  chunkSize: z.number().positive().default(512),
  chunkOverlap: z.number().nonnegative().default(50),
});

export type MemoryConfigType = z.infer<typeof MemoryConfig>;

export const defaultMemoryConfig: MemoryConfigType = {
  shortTermCapacity: 100,
  longTermThreshold: 0.7,
  vectorStoreType: 'pinecone',
  embeddingModel: 'text-embedding-ada-002',
  similarityMetric: 'cosine',
  chunkSize: 512,
  chunkOverlap: 50,
};
