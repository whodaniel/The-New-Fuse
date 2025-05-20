/**
 * Standardized Base Service
 * Provides consistent patterns for all services in the application
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

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
@Injectable()
export abstract class BaseService<T> {
  protected readonly logger: Logger;
  protected abstract readonly repository: IBaseRepository<T>;
  
  constructor(serviceName?: string) {
    this.logger = new Logger(serviceName || this.constructor.name);
  }

  /**
   * Find all entities with optional filtering
   */
  async findAll(filter?: Record<string, any>): Promise<T[]> {
    try {
      return await this.repository.findAll(filter);
    } catch (error) {
      this.logger.error(`Error finding all entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T> {
    try {
      const entity = await this.repository.findById(id);
      if (!entity) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }
      return entity;
    } catch (error) {
      this.logger.error(`Error finding entity with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find one entity by filter
   */
  async findOne(filter: Record<string, any>): Promise<T | null> {
    try {
      return await this.repository.findOne(filter);
    } catch (error) {
      this.logger.error(`Error finding entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const entity = await this.repository.create(data);
      this.logger.log(`Created new entity with ID ${(entity as any).id || 'unknown'}`);
      return entity;
    } catch (error) {
      this.logger.error(`Error creating entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an entity
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const entity = await this.repository.update(id, data);
      if (!entity) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }
      this.logger.log(`Updated entity with ID ${id}`);
      return entity;
    } catch (error) {
      this.logger.error(`Error updating entity with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      this.logger.log(`Deleted entity with ID ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting entity with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Count entities
   */
  async count(filter?: Record<string, any>): Promise<number> {
    try {
      return await this.repository.count(filter);
    } catch (error) {
      this.logger.error(`Error counting entities: ${error.message}`, error.stack);
      throw error;
    }
  }
}