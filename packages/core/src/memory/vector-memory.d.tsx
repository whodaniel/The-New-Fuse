import { Node } from '../graph/node.js';
export interface VectorMemoryOptions {
    dimensions: number;
    maxSize?: number;
    similarityThreshold?: number;
}
export interface MemoryVector {
    vector: number[];
    node: Node;
    timestamp: number;
    importance: number;
}
export declare class VectorMemoryManager {
    private vectors;
    private readonly dimensions;
    private readonly maxSize;
    private readonly similarityThreshold;
    constructor(options: VectorMemoryOptions);
    addMemory(): Promise<void>;
}
