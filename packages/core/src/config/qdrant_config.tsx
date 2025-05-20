import { z } from 'zod';

export const QdrantConfigSchema = z.object({
  url: z.string().default('http://localhost:6333'), // Replace with your actual default or environment variable
  apiKey: z.string().optional(), // API key might be optional or managed via environment
  collectionName: z.string().default('the_new_fuse_codebase'),
  vectorSize: z.number().default(1536), // for text-embedding-ada-002
  distance: z.enum(['Cosine', 'Euclid', 'Dot']).default('Cosine'),
});

export type QdrantConfigType = z.infer<typeof QdrantConfigSchema>;