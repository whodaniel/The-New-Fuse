import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
export class VectorStore extends EventEmitter {
    constructor(provider) {
        super();
        this.logger = new Logger(VectorStore.name);
        this.namespace = 'default';
        this.provider = provider;
    }
    async search(query) {
        try {
            const results = await this.provider.search([], query);
            this.emit('search_completed', { query, results });
            return results;
        }
        catch (error) {
            this.logger.error('Search failed', error);
            this.emit('search_failed', { query, error });
            throw error;
        }
    }
    async addDocuments(documents) {
        try {
            const ids = await this.provider.storeVectors(documents, this.namespace);
            this.emit('documents_added', { documents });
            return ids;
        }
        catch (error) {
            this.logger.error('Failed to add documents', error);
            this.emit('documents_add_failed', { documents, error });
            throw error;
        }
    }
    async deleteDocuments(ids) {
        try {
            const result = await this.provider.deleteVectors(ids, this.namespace);
            this.emit('documents_deleted', { ids });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to delete documents', error);
            this.emit('documents_delete_failed', { ids, error });
            throw error;
        }
    }
}
//# sourceMappingURL=vector-store.js.map