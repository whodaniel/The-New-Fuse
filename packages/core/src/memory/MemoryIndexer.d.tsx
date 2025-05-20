export declare class MemoryIndexer {
    private logger;
    private redis;
    private db;
    private config;
    constructor();
    indexMemory(): Promise<void>;
}
