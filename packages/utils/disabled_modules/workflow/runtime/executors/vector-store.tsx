
export {}
exports.VectorStoreNodeExecutor = void 0;
import types_1 from '../types.js';
class VectorStoreNodeExecutor {
    constructor() {
        this.stores = new Map();
    }
    async validate(node): Promise<void> {
        const { operation, store, config } = node.data;
        if (!operation || !store || !config.indexName) {
            throw new types_1.WorkflowError('Operation, store, and indexName are required', node.id);
        }
        return true;
    }
    async execute(node, context): Promise<void> {
        const { operation, store, config } = node.data;
        const { inputs, logger } = context;
        logger.debug('Executing vector store node', { nodeId: node.id, operation, store });
        try {
            let vectorStore = this.stores.get(store);
            if (!vectorStore) {
                vectorStore = await this.initializeStore(store, config);
                this.stores.set(store, vectorStore);
            }
            switch (operation) {
                case 'upsert':
                    return this.handleUpsert(vectorStore, inputs, config);
                case 'query':
                    return this.handleQuery(vectorStore, inputs, config);
                case 'delete':
                    return this.handleDelete(vectorStore, inputs, config);
                default:
                    throw new Error(`Invalid operation: ${operation}`);
            }
        }
        catch (error) {
            logger.error('Vector store node execution failed', error, { nodeId: node.id });
            throw error;
        }
    }
    async initializeStore(store, config): Promise<any> {
        switch (store) {
            case 'pinecone':
                // Initialize Pinecone client
                return {
                    async upsert(vectors): Promise<void> {
                        // Implement Pinecone upsert
                        return { inserted: vectors.length };
                    },
                    async query(vector, k): Promise<any> {
                        // Implement Pinecone query
                        return { matches: [] };
                    },
                    async delete(ids): Promise<void> {
                        // Implement Pinecone delete
                        return { deleted: ids.length };
                    },
                };
            case 'chroma':
                // Initialize Chroma client
                return {
                    async upsert(vectors): Promise<void> {
                        // Implement Chroma upsert
                        return { inserted: vectors.length };
                    },
                    async query(vector, k): Promise<any> {
                        // Implement Chroma query
                        return { matches: [] };
                    },
                    async delete(ids): Promise<void> {
                        // Implement Chroma delete
                        return { deleted: ids.length };
                    },
                };
            case 'redis':
                // Initialize Redis client
                return {
                    async upsert(vectors): Promise<void> {
                        // Implement Redis upsert
                        return { inserted: vectors.length };
                    },
                    async query(vector, k): Promise<any> {
                        // Implement Redis query
                        return { matches: [] };
                    },
                    async delete(ids): Promise<void> {
                        // Implement Redis delete
                        return { deleted: ids.length };
                    },
                };
            default:
                throw new Error(`Unsupported vector store: ${store}`);
        }
    }
    async handleUpsert(vectorStore, inputs, config): Promise<any> {
        const { vectors } = inputs;
        if (!vectors || !Array.isArray(vectors)) {
            throw new Error('Input vectors array is required for upsert operation');
        }
        return await vectorStore.upsert(vectors);
    }
    async handleQuery(vectorStore, inputs, config): Promise<any> {
        const { vector, k = 10 } = inputs;
        if (!vector || !Array.isArray(vector)) {
            throw new Error('Input vector is required for query operation');
        }
        return await vectorStore.query(vector, k);
    }
    async handleDelete(vectorStore, inputs, config): Promise<any> {
        const { ids } = inputs;
        if (!ids || !Array.isArray(ids)) {
            throw new Error('Input ids array is required for delete operation');
        }
        return await vectorStore.delete(ids);
    }
    async cleanup(): Promise<void> {
        // Close vector store connections
        for (const [, store] of this.stores.entries()) {
            if (store.close) {
                await store.close();
            }
        }
        this.stores.clear();
    }
}
exports.VectorStoreNodeExecutor = VectorStoreNodeExecutor;
//# sourceMappingURL=vector-store.js.mapexport {};
