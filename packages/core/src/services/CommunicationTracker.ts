
export {}
exports.CommunicationTracker = void 0;
import ioredis_1 from 'ioredis';
import communication_1 from '../types/communication.js';
class CommunicationTracker {
    constructor() {
        this.recordsKey = 'communication_records';
        this.blockchainKey = 'blockchain_records';
        this.modelKey = 'model_records';
        this.tokenKey = 'token_records';
        this.walletKey = 'wallet_records';
        this.resourceKey = 'resource_records';
        if (CommunicationTracker.instance) {
            return CommunicationTracker.instance;
        }
        this.redis = new ioredis_1.Redis();
        CommunicationTracker.instance = this;
    }
    async track(): Promise<void> {context) {
        const record = new communication_1.CommunicationRecord(context);
        await this.redis.hset(this.recordsKey, record.id, JSON.stringify(record.toJSON()));
        // Store specific metadata based on content type
        const metadata = record.context.content.metadata;
        if (metadata) {
            if (metadata.blockchain) {
                await this.recordBlockchainInteraction(record.id, metadata.blockchain);
            }
            if (metadata.model) {
                await this.recordModelInteraction(record.id, metadata.model);
            }
            if (metadata.token) {
                await this.recordTokenInteraction(record.id, metadata.token);
            }
            if (metadata.wallet) {
                await this.recordWalletInteraction(record.id, metadata.wallet);
            }
            if (metadata.resource) {
                await this.recordResourceInteraction(record.id, metadata.resource);
            }
        }
        return record;
    }
    // Record specific interaction types
    async recordBlockchainInteraction(): Promise<void> {recordId, metadata) {
        await this.redis.hset(this.blockchainKey, recordId, JSON.stringify(metadata));
    }
    async recordModelInteraction(): Promise<void> {recordId, metadata) {
        await this.redis.hset(this.modelKey, recordId, JSON.stringify(metadata));
    }
    async recordTokenInteraction(): Promise<void> {recordId, metadata) {
        await this.redis.hset(this.tokenKey, recordId, JSON.stringify(metadata));
    }
    async recordWalletInteraction(): Promise<void> {recordId, metadata) {
        await this.redis.hset(this.walletKey, recordId, JSON.stringify(metadata));
    }
    async recordResourceInteraction(): Promise<void> {recordId, metadata) {
        await this.redis.hset(this.resourceKey, recordId, JSON.stringify(metadata));
    }
    // Get specific metadata types
    async getBlockchainMetadata(): Promise<void> {recordId) {
        const metadata = await this.redis.hget(this.blockchainKey, recordId);
        return metadata ? JSON.parse(metadata) : null;
    }
    async getModelMetadata(): Promise<void> {recordId) {
        const metadata = await this.redis.hget(this.modelKey, recordId);
        return metadata ? JSON.parse(metadata) : null;
    }
    async getTokenMetadata(): Promise<void> {recordId) {
        const metadata = await this.redis.hget(this.tokenKey, recordId);
        return metadata ? JSON.parse(metadata) : null;
    }
    async getWalletMetadata(): Promise<void> {recordId) {
        const metadata = await this.redis.hget(this.walletKey, recordId);
        return metadata ? JSON.parse(metadata) : null;
    }
    async getResourceMetadata(): Promise<void> {recordId) {
        const metadata = await this.redis.hget(this.resourceKey, recordId);
        return metadata ? JSON.parse(metadata) : null;
    }
    // Get records with enhanced filtering
    async getRecords(): Promise<void> {filters) {
        const allRecords = await this.redis.hgetall(this.recordsKey);
        let records = Object.values(allRecords).map(recordJson => {
            const record = JSON.parse(recordJson);
            return new communication_1.CommunicationRecord(record.context);
        });
        if (filters) {
            records = records.filter(record => {
                const metadata = record.context.content.metadata;
                const matchesPlatform = !filters.platform || record.context.platform.type === filters.platform;
                const matchesContentType = !filters.contentType || record.context.content.type === filters.contentType;
                const matchesTransactionType = !filters.transactionType ||
                    metadata?.blockchain?.transactionType === filters.transactionType;
                const matchesModelType = !filters.modelType ||
                    metadata?.model?.type === filters.modelType;
                const matchesTokenType = !filters.tokenType ||
                    metadata?.token?.type === filters.tokenType;
                const matchesWalletType = !filters.walletType ||
                    metadata?.wallet?.type === filters.walletType;
                const matchesResourceType = !filters.resourceType ||
                    metadata?.resource?.type === filters.resourceType;
                const matchesTimeRange = (!filters.startTime || record.context.timestamp >= filters.startTime) &&
                    (!filters.endTime || record.context.timestamp <= filters.endTime);
                return matchesPlatform && matchesContentType && matchesTransactionType &&
                    matchesModelType && matchesTokenType && matchesWalletType &&
                    matchesResourceType && matchesTimeRange;
            });
            if (filters.offset) {
                records = records.slice(filters.offset);
            }
            if (filters.limit) {
                records = records.slice(0, filters.limit);
            }
        }
        return records;
    }
    // Get statistics for different interaction types
    async getBlockchainStats(): Promise<void> {) {
        const allMetadata = await this.redis.hgetall(this.blockchainKey);
        const stats = {
            totalTransactions: 0,
            transactionsByType: {},
            transactionsByChain: {}
        };
        Object.values(allMetadata).forEach(metadataJson => {
            const metadata = JSON.parse(metadataJson);
            stats.totalTransactions++;
            if (metadata.transactionType) {
                stats.transactionsByType[metadata.transactionType] =
                    (stats.transactionsByType[metadata.transactionType] || 0) + 1;
            }
            const chainKey = `${metadata.chain}:${metadata.network}`;
            stats.transactionsByChain[chainKey] =
                (stats.transactionsByChain[chainKey] || 0) + 1;
        });
        return stats;
    }
    async getModelStats(): Promise<void> {) {
        const allMetadata = await this.redis.hgetall(this.modelKey);
        const stats = {
            totalInteractions: 0,
            interactionsByType: {},
            tokenUsage: {
                totalPromptTokens: 0,
                totalCompletionTokens: 0,
                totalTokens: 0
            },
            performance: {
                averageLatency: 0,
                averageThroughput: 0,
                errorRate: 0
            }
        };
        let totalLatency = 0;
        let totalThroughput = 0;
        let errorCount = 0;
        Object.values(allMetadata).forEach(metadataJson => {
            const metadata = JSON.parse(metadataJson);
            stats.totalInteractions++;
            if (metadata.type) {
                stats.interactionsByType[metadata.type] =
                    (stats.interactionsByType[metadata.type] || 0) + 1;
            }
            if (metadata.usage) {
                stats.tokenUsage.totalPromptTokens += metadata.usage.promptTokens || 0;
                stats.tokenUsage.totalCompletionTokens += metadata.usage.completionTokens || 0;
                stats.tokenUsage.totalTokens += metadata.usage.totalTokens || 0;
            }
            if (metadata.performance) {
                totalLatency += metadata.performance.latency || 0;
                totalThroughput += metadata.performance.throughput || 0;
                errorCount += metadata.performance.errorRate || 0;
            }
        });
        const count = Object.keys(allMetadata).length;
        if (count > 0) {
            stats.performance.averageLatency = totalLatency / count;
            stats.performance.averageThroughput = totalThroughput / count;
            stats.performance.errorRate = errorCount / count;
        }
        return stats;
    }
    async getTokenStats(): Promise<void> {) {
        const allMetadata = await this.redis.hgetall(this.tokenKey);
        const stats = {
            totalTokens: 0,
            tokensByType: {},
            mintableTokens: 0,
            burnableTokens: 0
        };
        Object.values(allMetadata).forEach(metadataJson => {
            const metadata = JSON.parse(metadataJson);
            stats.totalTokens++;
            if (metadata.type) {
                stats.tokensByType[metadata.type] =
                    (stats.tokensByType[metadata.type] || 0) + 1;
            }
            if (metadata.mintable)
                stats.mintableTokens++;
            if (metadata.burnable)
                stats.burnableTokens++;
        });
        return stats;
    }
    async getWalletStats(): Promise<void> {) {
        const allMetadata = await this.redis.hgetall(this.walletKey);
        const stats = {
            totalWallets: 0,
            walletsByType: {},
            walletsByChain: {}
        };
        Object.values(allMetadata).forEach(metadataJson => {
            const metadata = JSON.parse(metadataJson);
            stats.totalWallets++;
            if (metadata.type) {
                stats.walletsByType[metadata.type] =
                    (stats.walletsByType[metadata.type] || 0) + 1;
            }
            const chainKey = `${metadata.chain}:${metadata.network}`;
            stats.walletsByChain[chainKey] =
                (stats.walletsByChain[chainKey] || 0) + 1;
        });
        return stats;
    }
    async getResourceStats(): Promise<void> {) {
        const allMetadata = await this.redis.hgetall(this.resourceKey);
        const stats = {
            totalResources: 0,
            resourcesByType: {},
            totalCapacity: {},
            totalCost: {}
        };
        Object.values(allMetadata).forEach(metadataJson => {
            const metadata = JSON.parse(metadataJson);
            stats.totalResources++;
            if (metadata.type) {
                stats.resourcesByType[metadata.type] =
                    (stats.resourcesByType[metadata.type] || 0) + 1;
            }
            if (metadata.capacity) {
                const unit = metadata.capacity.unit;
                if (!stats.totalCapacity[unit]) {
                    stats.totalCapacity[unit] = {
                        total: 0,
                        used: 0,
                        available: 0
                    };
                }
                stats.totalCapacity[unit].total += metadata.capacity.total;
                stats.totalCapacity[unit].used += metadata.capacity.used;
                stats.totalCapacity[unit].available += metadata.capacity.available;
            }
            if (metadata.cost) {
                const currency = metadata.cost.currency;
                stats.totalCost[currency] = (stats.totalCost[currency] || 0) + metadata.cost.amount;
            }
        });
        return stats;
    }
    // Clear all records
    async clearRecords(): Promise<void> {) {
        await this.redis.del(this.recordsKey);
        await this.redis.del(this.blockchainKey);
        await this.redis.del(this.modelKey);
        await this.redis.del(this.tokenKey);
        await this.redis.del(this.walletKey);
        await this.redis.del(this.resourceKey);
    }
}
exports.CommunicationTracker = CommunicationTracker;
//# sourceMappingURL=CommunicationTracker.js.mapexport {};
