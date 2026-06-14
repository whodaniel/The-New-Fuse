/**
 * Standardized Base Service
 * Provides consistent patterns for all services in the application
 */
import { Logger } from '@nestjs/common';
/**
 * Generic repository interface to standardize data access
 */
export interface IBaseRepository<T> {
    findAll(filter?: Record<string, any>): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    findOne(filter: Record<string, any>): Promise<T | null>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    count(filter?: Record<string, any>): Promise<number>;
}
/**
 * Base service that can be extended by all domain services
 * Provides standardized CRUD operations
 */
export declare abstract class BaseService<T> {
    protected readonly logger: Logger;
    protected abstract readonly repository: IBaseRepository<T>;
    constructor(serviceName?: string);
    /**
     * Find all entities with optional filtering
     */
    findAll(filter?: Record<string, any>): Promise<T[]>;
    /**
     * Find entity by ID
     */
    findById(id: string): Promise<T>;
    /**
     * Find one entity by filter
     */
    findOne(filter: Record<string, any>): Promise<T | null>;
    /**
     * Create a new entity
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Update an entity
     */
    update(id: string, data: Partial<T>): Promise<T>;
    /**
     * Delete an entity
     */
    delete(id: string): Promise<boolean>;
    /**
     * Count entities
     */
    count(filter?: Record<string, any>): Promise<number>;
}
//# sourceMappingURL=base.service.d.ts.map