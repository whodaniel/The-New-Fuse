export interface MemoryContent {
    id: string;
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface MemoryQuery {
    query: string;
    limit?: number;
    filters?: Record<string, any>;
}
export declare class MemorySystem {
    private memories;
    constructor();
    store(content: MemoryContent): Promise<void>;
    retrieve(query: MemoryQuery): Promise<MemoryContent[]>;
    search(query: string): Promise<MemoryContent[]>;
}
//# sourceMappingURL=MemorySystem.d.ts.map