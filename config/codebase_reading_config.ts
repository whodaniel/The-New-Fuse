import { z } from 'zod';

export const CodebaseReadingConfig = z.object({
  chunkSize: z.number().positive().default(512),
  chunkOverlap: z.number().nonnegative().default(50),
  vectorStoreType: z.enum(['pinecone', 'qdrant', 'milvus']).default('pinecone'),
  embeddingModel: z.enum(['text-embedding-ada-002', 'all-MiniLM-L6-v2']).default('text-embedding-ada-002'),
  fileExtensions: z.array(z.string()).default(['.ts', '.js', '.ts', '.json', '.md']),
  excludePatterns: z.array(z.string()).default(['node_modules', 'dist', '.git']),
  maxConcurrentFiles: z.number().positive().default(5),
  enableIncrementalUpdates: z.boolean().default(true)
});

export type CodebaseReadingConfigType = z.infer<typeof CodebaseReadingConfig>;