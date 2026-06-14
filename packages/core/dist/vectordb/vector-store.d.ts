import { EventEmitter } from 'events';
import { VectorStoreProvider, VectorDocument, SearchResult, VectorQuery } from './types.js';
export declare class VectorStore extends EventEmitter {
    private logger;
    private provider;
    private namespace;
    constructor(provider: VectorStoreProvider);
    search(query: VectorQuery): Promise<SearchResult[]>;
    addDocuments(documents: VectorDocument[]): Promise<string[]>;
    deleteDocuments(ids: string[]): Promise<boolean>;
}
//# sourceMappingURL=vector-store.d.ts.map