import { z } from 'zod';
export declare const MemoryConfig: z.ZodObject<{
    shortTermCapacity: z.ZodDefault<z.ZodNumber>;
    longTermThreshold: z.ZodDefault<z.ZodNumber>;
    vectorStoreType: z.ZodDefault<z.ZodEnum<["pinecone", "qdrant", "milvus"]>>;
    embeddingModel: z.ZodDefault<z.ZodEnum<["text-embedding-ada-002", "all-MiniLM-L6-v2"]>>;
    similarityMetric: z.ZodDefault<z.ZodEnum<["cosine", "euclidean", "dot"]>>;
    chunkSize: z.ZodDefault<z.ZodNumber>;
    chunkOverlap: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    shortTermCapacity: number;
    longTermThreshold: number;
    vectorStoreType: "pinecone" | "qdrant" | "milvus";
    embeddingModel: "text-embedding-ada-002" | "all-MiniLM-L6-v2";
    similarityMetric: "dot" | "cosine" | "euclidean";
    chunkSize: number;
    chunkOverlap: number;
}, {
    shortTermCapacity?: number | undefined;
    longTermThreshold?: number | undefined;
    vectorStoreType?: "pinecone" | "qdrant" | "milvus" | undefined;
    embeddingModel?: "text-embedding-ada-002" | "all-MiniLM-L6-v2" | undefined;
    similarityMetric?: "dot" | "cosine" | "euclidean" | undefined;
    chunkSize?: number | undefined;
    chunkOverlap?: number | undefined;
}>;
export type MemoryConfigType = z.infer<typeof MemoryConfig>;
export declare const defaultMemoryConfig: MemoryConfigType;
