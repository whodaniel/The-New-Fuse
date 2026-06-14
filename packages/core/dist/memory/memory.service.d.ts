export declare enum MemoryType {
    SHORT_TERM = "short_term",
    LONG_TERM = "long_term",
    EPISODIC = "episodic",
    SEMANTIC = "semantic"
}
export interface CreateMemoryDto {
    content: string;
    type: MemoryType;
    metadata?: Record<string, any>;
    importance?: number;
    tags?: string[];
}
export interface UpdateMemoryDto {
    content?: string;
    type?: MemoryType;
    metadata?: Record<string, any>;
    importance?: number;
    tags?: string[];
}
export declare class MemoryService {
    createMemory(createMemoryDto: CreateMemoryDto): Promise<any>;
    findMemoryById(id: string): Promise<any>;
    findMemoriesByType(type: MemoryType): Promise<any[]>;
    updateMemory(id: string, updateMemoryDto: UpdateMemoryDto): Promise<any>;
    deleteMemory(id: string): Promise<void>;
    findAllMemories(): Promise<any[]>;
    searchMemories(query: string): Promise<any[]>;
}
//# sourceMappingURL=memory.service.d.ts.map