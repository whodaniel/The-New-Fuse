export interface MemoryItem {
    id: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
    timestamp: string;
    type?: 'core' | 'context' | 'short-term' | 'long-term';
}
export interface MemoryStats {
    totalItems: number;
    hitRate: number;
    avgImportance?: number;
}
