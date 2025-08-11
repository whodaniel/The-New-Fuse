export interface MemoryQuery {
  // Implementation needed
}
    query: string;
    limit?: number;
    filter?: {
  // Implementation needed
}
        type?: string;
        timeRange?: {
  // Implementation needed
}
            start: Date;
            end: Date;
        };
        tags?: string[];
    };
}

export interface MemoryContent {
  // Implementation needed
}
    type: string;
    data: unknown;
    metadata?: {
  // Implementation needed
}
        timestamp?: Date;
        source?: string;
        tags?: string[];
        [key: string]: unknown;
    };
}

export interface VectorStore {
  // Implementation needed
}
    add(content: MemoryContent): Promise<void>;
    search(query: MemoryQuery): Promise<MemoryContent[]>;
    delete(filter: Partial<MemoryContent>): Promise<void>;
    clear(): Promise<void>;
}

export interface MemorySystem {
  // Implementation needed
}
    add(content: MemoryContent): Promise<void>;
    search(query: MemoryQuery): Promise<MemoryContent[]>;
    delete(filter: Partial<MemoryContent>): Promise<void>;
    clear(): Promise<void>;
    getStats(): Promise< {
  // Implementation needed
}
        totalMemories: number;
        byType: Record<string, number>;
        oldestMemory: Date;
        newestMemory: Date;
    }>;
}
