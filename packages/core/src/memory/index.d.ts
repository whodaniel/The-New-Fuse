import { SemanticIndex } from './semantic.tsx';
import { MemoryContent } from '../types/memory.types.js';
export declare class MemorySystem {
    add(content: MemoryContent): void;
    readonly index: SemanticIndex;
    private readonly cache;
    private readonly embeddingService;
    private readonly configService;
}
export * from './MemoryManager.tsx';
export * from './MemorySystem.tsx';
export * from './VectorMemoryStore.tsx';
export * from './memory.entity.tsx';
export * from './types.tsx';
export * from '../types/memory.types.js';
