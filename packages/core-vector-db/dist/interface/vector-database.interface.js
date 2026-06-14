import { z } from 'zod';
// Vector operation schemas
export const VectorDocumentSchema = z.object({
    id: z.string(),
    content: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
    embedding: z.array(z.number()).optional(),
});
export const VectorQuerySchema = z.object({
    query: z.string().optional(),
    embedding: z.array(z.number()).optional(),
    limit: z.number().default(10),
    threshold: z.number().default(0.7),
    metadata_filter: z.record(z.string(), z.any()).optional(),
});
export const VectorSearchResultSchema = z.object({
    id: z.string(),
    content: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
    score: z.number(),
    distance: z.number(),
});
export const CollectionConfigSchema = z.object({
    name: z.string(),
    dimension: z.number(),
    metric: z.enum(['cosine', 'euclidean', 'dot_product']).default('cosine'),
    description: z.string().optional(),
});
//# sourceMappingURL=vector-database.interface.js.map