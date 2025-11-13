/**
 * Base service pattern for all application services
 * Provides standardized CRUD operations and error handling
 */
import { Logger } from '@nestjs/common';
export declare abstract class BaseService<T> {
    protected readonly repository: any;
    protected readonly logger: Logger;
    constructor(repository: any, serviceName: string);
    /**
     * Find all entities with optional filtering
     * @param filter Optional filter criteria
     * @param include Optional relations to include
     * @param orderBy Optional ordering
     * @param skip Optional number of records to skip
     * @param take Optional number of records to take
     * @returns Array of entities
     */
    findAll(filter?: Record<string, any>, include?: Record<string, boolean>, orderBy?: Record<string, 'asc' | 'desc'>, skip?: number, take?: number): Promise<T[]>;
    /**
     * Find entity by ID
     * @param id Entity ID
     * @param include Optional relations to include
     * @returns Entity or null if not found
     */
    findById(id: string, include?: Record<string, boolean>): Promise<T | null>;
    /**
     * Find first entity matching filter criteria
     * @param filter Filter criteria
     * @param include Optional relations to include
     * @returns Entity or null if not found
     */
    findOne(filter: Record<string, any>, include?: Record<string, boolean>): Promise<T | null>;
    /**
     * Create a new entity
     * @param data Entity data
     * @returns Created entity
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Update an entity by ID
     * @param id Entity ID
     * @param data Updated entity data
     * @returns Updated entity
     */
    update(id: string, data: Partial<T>): Promise<T>;
}
//# sourceMappingURL=base.service.d.ts.map