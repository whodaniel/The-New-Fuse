/**
 * Unified Entity Repository
 *
 * Repository implementation for unified entities with event sourcing
 * and adaptive storage strategies.
 */
import { EventPublisher } from '@nestjs/cqrs';
import { UnifiedEntity, EntityId, DiscoverySource } from '../domain/UnifiedEntity';
export interface EntityQuery {
    ids?: string[];
    archetypes?: string[];
    sources?: DiscoverySource[];
    capabilities?: string[];
    tags?: string[];
    isActive?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'discoveredAt' | 'lastUpdated' | 'capabilityScore';
    sortOrder?: 'asc' | 'desc';
}
export interface EntitySearchResult {
    entities: UnifiedEntity[];
    totalCount: number;
    hasMore: boolean;
}
export declare class UnifiedEntityRepository {
    private readonly eventPublisher;
    private readonly logger;
    private entities;
    private indexes;
    constructor(eventPublisher: EventPublisher);
    save(entity: UnifiedEntity): Promise<void>;
    findById(id: EntityId): Promise<UnifiedEntity | null>;
    findByName(name: string): Promise<UnifiedEntity | null>;
    findAll(): Promise<UnifiedEntity[]>;
    search(query: EntityQuery): Promise<EntitySearchResult>;
    findSimilarEntities(entity: UnifiedEntity, limit?: number): Promise<UnifiedEntity[]>;
    findByCapabilityType(capabilityType: string): Promise<UnifiedEntity[]>;
    getStatistics(): Promise<any>;
    delete(id: EntityId): Promise<boolean>;
    clear(): Promise<void>;
    private updateIndexes;
    private removeFromIndexes;
    private clearIndexes;
    private intersect;
    private matchesQuery;
    private sortEntities;
    private getCountByKey;
    private getCapabilityDistribution;
    private getCapabilityBucket;
    private calculateAverageCapabilityScore;
    private getLastUpdateTime;
}
//# sourceMappingURL=UnifiedEntityRepository.d.ts.map