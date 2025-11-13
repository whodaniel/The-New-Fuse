"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionConfigSchema = exports.VectorSearchResultSchema = exports.VectorQuerySchema = exports.VectorDocumentSchema = void 0;
const zod_1 = require("zod");
// Vector operation schemas
exports.VectorDocumentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    content: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    embedding: zod_1.z.array(zod_1.z.number()).optional(),
});
exports.VectorQuerySchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    embedding: zod_1.z.array(zod_1.z.number()).optional(),
    limit: zod_1.z.number().default(10),
    threshold: zod_1.z.number().default(0.7),
    metadata_filter: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.VectorSearchResultSchema = zod_1.z.object({
    id: zod_1.z.string(),
    content: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    score: zod_1.z.number(),
    distance: zod_1.z.number(),
});
exports.CollectionConfigSchema = zod_1.z.object({
    name: zod_1.z.string(),
    dimension: zod_1.z.number(),
    metric: zod_1.z.enum(['cosine', 'euclidean', 'dot_product']).default('cosine'),
    description: zod_1.z.string().optional(),
});
//# sourceMappingURL=vector-database.interface.js.map