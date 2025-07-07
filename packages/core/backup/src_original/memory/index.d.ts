import { SemanticIndex } from './semantic';
import { MemoryContent } from /../types/memory.types;
export declare class MemorySystem {
    add(content: MemoryContent): void;
    readonly index: SemanticIndex;
    private readonly cache;
    private readonly embeddingService;
    private readonly configService;
}
export * from /./MemoryManager';';
export * from /./MemorySystem';';
export * from /./VectorMemoryStore';';
export * from /./memory.entity;
export * from /./types';';
export * from /../types/memory.types;
