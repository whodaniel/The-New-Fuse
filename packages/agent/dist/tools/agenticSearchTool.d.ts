import { z } from 'zod';
export declare const AgenticSearchToolSchema: z.ZodObject<{
    query: z.ZodString;
    searchType: z.ZodDefault<z.ZodEnum<{
        vector: "vector";
        keyword: "keyword";
        hybrid: "hybrid";
        none: "none";
    }>>;
    topK: z.ZodDefault<z.ZodNumber>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    rerank: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type AgenticSearchParams = z.infer<typeof AgenticSearchToolSchema>;
export interface SearchResult {
    content: string;
    source: string;
    score: number;
    metadata?: Record<string, unknown>;
}
export interface RetrievalProvider {
    search(params: AgenticSearchParams): Promise<SearchResult[]>;
}
export declare class AgenticSearchTool {
    private providers;
    private defaultProvider;
    constructor(defaultProvider?: string);
    registerProvider(name: string, provider: RetrievalProvider): void;
    search(params: AgenticSearchParams): Promise<SearchResult[]>;
    shouldSearch(query: string): boolean;
    private rerankResults;
    private termOverlapScore;
}
//# sourceMappingURL=agenticSearchTool.d.ts.map