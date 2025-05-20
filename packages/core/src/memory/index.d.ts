import { SemanticIndex } from './semantic.js';
import { MemoryContent } from '../types/memory.types.js';
export declare class MemorySystem {
    add(content: MemoryContent): void;
    readonly index: SemanticIndex;
    private readonly cache;
    private readonly embeddingService;
    private readonly configService;
}
export * from './MemoryManager.js';
export * from './MemorySystem.js';
export * from './VectorMemoryStore.js';
export * from './memory.entity.js';
export * from './types.js';
export * from '../types/memory.types.js';
