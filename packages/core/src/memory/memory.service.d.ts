import { Repository } from 'typeorm';
import { Memory, MemoryType } from './memory.entity';
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
    private readonly memoryRepository;
    private readonly logger;
    constructor(memoryRepository: Repository<Memory>);
    createMemory(createMemoryDto: CreateMemoryDto): Promise<Memory>;
    findMemoryById(id: string): Promise<Memory | null>;
    findMemoriesByType(type: MemoryType): Promise<Memory[]>;
    updateMemory(id: string, updateMemoryDto: UpdateMemoryDto): Promise<Memory | null>;
    deleteMemory(id: string): Promise<void>;
    findAllMemories(): Promise<Memory[]>;
    searchMemories(query: string): Promise<Memory[]>;
}
//# sourceMappingURL=memory.service.d.ts.map