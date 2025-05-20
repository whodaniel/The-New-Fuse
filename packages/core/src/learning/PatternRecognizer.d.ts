import { VectorMemoryStore } from '../memory/VectorMemoryStore.js';
import { DatabaseService } from '@the-new-fuse/database';
export declare class PatternRecognizer {
    private logger;
    private vectorStore;
    private db;
    private readonly minConfidence;
    private readonly minFrequency;
    constructor(vectorStore: VectorMemoryStore, db: DatabaseService);
    private extractPatterns;
}
