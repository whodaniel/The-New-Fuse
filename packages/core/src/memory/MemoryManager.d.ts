/**
 * @fileoverview Memory manager that coordinates multiple memory systems
 */
import { MemorySystem } from './MemorySystem';
import { MemoryContent, MemoryQuery, MemoryQueryResult, MemoryContentType } from '../types/memory';
import { ServiceState } from '../constants/types';
export declare class MemoryManager {
    private readonly logger;
    private state;
    private memorySystems;
    private defaultSystem;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    store(content: Omit<MemoryContent, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>, systemName?: string): Promise<string>;
    retrieve(id: string, systemName?: string): Promise<MemoryContent | null>;
    update(id: string, updates: Partial<Omit<MemoryContent, 'id' | 'createdAt' | 'accessCount' | 'lastAccessed'>>, systemName?: string): Promise<MemoryContent | null>;
    delete(id: string, systemName?: string): Promise<boolean>;
    search(query: MemoryQuery, systemName?: string): Promise<MemoryQueryResult>;
    searchAll(query: MemoryQuery): Promise<MemoryQueryResult>;
    storeAgentMemory(agentId: string, content: string, type: MemoryContentType, metadata?: Record<string, any>): Promise<string>;
    getAgentMemories(agentId: string, limit?: number): Promise<MemoryContent[]>;
    storeConversation(agentId: string, conversation: string, metadata?: Record<string, any>): Promise<string>;
    storeTaskResult(agentId: string, taskId: string, result: any, metadata?: Record<string, any>): Promise<string>;
    storeKnowledge(content: string, tags: string[], metadata?: Record<string, any>): Promise<string>;
    addMemorySystem(name: string, system: MemorySystem): void;
    removeMemorySystem(name: string): boolean;
    getMemorySystemNames(): string[];
    getSystemStats(systemName?: string): Promise<Record<string, any>>;
    findSimilarMemories(content: string, limit?: number): Promise<MemoryContent[]>;
    getRecentMemories(agentId?: string, limit?: number): Promise<MemoryContent[]>;
    getMemoriesByTag(tag: string, limit?: number): Promise<MemoryContent[]>;
    private getMemorySystem;
    private combineSuggestions;
}
//# sourceMappingURL=MemoryManager.d.ts.map