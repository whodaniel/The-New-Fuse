import { z } from 'zod';
export declare const SearchOutputSchema: z.ZodObject<{
    search_answer: z.ZodString;
    sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        snippet: z.ZodOptional<z.ZodString>;
        relevance_score: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    confidence: z.ZodDefault<z.ZodNumber>;
    follow_up_queries: z.ZodDefault<z.ZodArray<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type SearchOutput = z.infer<typeof SearchOutputSchema>;
export interface SearchAgentConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}
export declare class StructuredSearchAgent {
    private config;
    constructor(config: SearchAgentConfig);
    getSystemPrompt(): string;
    parseOutput(raw: string): SearchOutput;
    validateOutput(output: SearchOutput): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=structuredSearchOutput.d.ts.map