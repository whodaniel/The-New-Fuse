export declare class MemoryService {
    private readonly memoryTreePath;
    private readonly llm;
    constructor(projectRoot: string);
    ensureTree(): Promise<void>;
    curate(prompt: string, filePaths?: string[], categoryOverride?: string): Promise<{
        path: string;
        category: any;
    }>;
    query(query: string, categoryFilter?: string): Promise<string>;
    getTree(): Promise<Record<string, string[]>>;
    private getAllMemoryMetadata;
}
//# sourceMappingURL=MemoryService.d.ts.map