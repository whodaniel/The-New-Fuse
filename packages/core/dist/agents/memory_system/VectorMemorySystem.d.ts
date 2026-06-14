import { PastTaskResult, VectorMemorySystem } from '../orchestration/types.js';
/**
 * Mock implementation of the VectorMemorySystem for development and testing.
 * In a real implementation, this would connect to a vector database.
 */
export declare class VectorMemorySystemImpl implements VectorMemorySystem {
    /**
     * Searches for similar past tasks in the vector memory.
     * @param query - The description of the current task.
     * @param options - Search options, including type and minimum relevance.
     * @returns A promise that resolves to a list of similar past task results.
     */
    search(query: string, options: {
        type: string;
        minRelevance: number;
    }): Promise<PastTaskResult[]>;
}
//# sourceMappingURL=VectorMemorySystem.d.ts.map