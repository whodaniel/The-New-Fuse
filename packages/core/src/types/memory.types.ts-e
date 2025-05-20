export interface MemoryQuery {
    query: string;
    limit?: number;
    filter?: {
        type?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
        tags?: string[];
    };
}

export interface MemoryContent {
    type: string;
    data: unknown;
    metadata?: {
        timestamp?: Date;
        source?: string;
        tags?: string[];
        [key: string]: unknown;
    };
}

export interface VectorStore {
    add(content: MemoryContent): Promise<void>;
    search(query: MemoryQuery): Promise<MemoryContent[]>;
    delete(filter: Partial<MemoryContent>): Promise<void>;
    clear(): Promise<void>;
}

export interface MemorySystem {
    add(content: MemoryContent): Promise<void>;
    search(query: MemoryQuery): Promise<MemoryContent[]>;
    delete(filter: Partial<MemoryContent>): Promise<void>;
    clear(): Promise<void>;
    getStats(): Promise< {
        totalMemories: number;
        byType: Record<string, number>;
        oldestMemory: Date;
        newestMemory: Date;
    }>;
}
