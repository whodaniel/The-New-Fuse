/**
 * @fileoverview Production-ready memory system for agent knowledge management
 */
import { MemoryContent, MemoryQuery, MemoryQueryResult, MemoryStorageConfig, MemoryStats } from '../types/memory';
import { ServiceState } from '../constants/types';
export declare class MemorySystem {
    private readonly logger;
    private state;
    private memories;
    private memoryIndex;
    private config;
    constructor(config?: Partial<MemoryStorageConfig>);
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    store(content: Omit<MemoryContent, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>): Promise<string>;
    retrieve(id: string): Promise<MemoryContent | null>;
    update(id: string, updates: Partial<Omit<MemoryContent, 'id' | 'createdAt' | 'accessCount' | 'lastAccessed'>>): Promise<MemoryContent | null>;
    delete(id: string): Promise<boolean>;
    search(query: MemoryQuery): Promise<MemoryQueryResult>;
    getStats(): Promise<MemoryStats>;
    private indexContent;
    private reindexContent;
    private removeFromIndex;
    private extractKeywords;
    private isStopWord;
    private calculateRelevanceScore;
    private getMatchedTerms;
    private generateSearchSuggestions;
    private performCleanup;
}
//# sourceMappingURL=MemorySystem.d.ts.map