import { VectorStoreProvider, VectorDocument, SearchResult, VectorQuery } from '../types.js';
export declare class PineconeProvider implements VectorStoreProvider {
    name: string;
    private client;
    constructor();
    storeVectors(documents: VectorDocument[], _namespace: string): Promise<string[]>;
    search(queryEmbedding: number[], options: VectorQuery): Promise<SearchResult[]>;
    deleteVectors(_ids: string[], _namespace: string): Promise<boolean>;
    clearNamespace(_namespace: string): Promise<boolean>;
    private performSearch;
}
//# sourceMappingURL=pinecone-provider.d.ts.map