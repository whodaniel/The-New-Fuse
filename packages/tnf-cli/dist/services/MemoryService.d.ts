export declare class MemoryService {
    private readonly memoryTreePath;
    private llm;
    constructor(projectRoot: string);
    private getLlm;
    ensureTree(): Promise<void>;
    curate(prompt: string, filePaths?: string[], categoryOverride?: string): Promise<{
        path: string;
        category: any;
    }>;
    private static readonly MAX_CONTEXT_MEMORIES;
    private static readonly MAX_CONTEXT_CHARS;
    query(query: string, categoryFilter?: string): Promise<string>;
    getTree(): Promise<Record<string, string[]>>;
    private getAllMemoryMetadata;
}
//# sourceMappingURL=MemoryService.d.ts.map