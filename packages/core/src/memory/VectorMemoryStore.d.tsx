import { VectorMemoryOptions } from './types/MemoryTypes.js';
export declare class VectorMemoryStore<T = any> {
    private apiEndpoint;
    private apiKey;
    private config;
    private clusterConfig;
    private cache?;
    private eventHandlers;
    private stats;
    private logger;
    constructor(options: VectorMemoryOptions);
    add(): Promise<void>;
}
