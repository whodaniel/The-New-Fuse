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
    catch(error: any): void;
}
//# sourceMappingURL=base.service.d.ts.map