/**
 * Base service pattern for all application services
 * Provides standardized CRUD operations and error handling
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { toError } from '../../utils/error'; // Import the helper

@Injectable()
export abstract class BaseService<T> {
  protected readonly logger: Logger;
  
  constructor(
    protected readonly repository: any,
    serviceName: string
  ) {
    this.logger = new Logger(serviceName);
  }

  /**
   * Find all entities with optional filtering
   * @param filter Optional filter criteria
   * @param include Optional relations to include
   * @param orderBy Optional ordering
   * @param skip Optional number of records to skip
   * @param take Optional number of records to take
   * @returns Array of entities
   */
  async findAll(
    filter: Record<string, any> = {},
    include: Record<string, boolean> = {},
    orderBy: Record<string, 'asc' | 'desc'> = {},
    skip = 0,
    take = 100
  ): Promise<T[]> {
    try {
      return await this.repository.findMany(filter);
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error finding all entities: ${err.message}`, err.stack); // Use err
      throw new InternalServerErrorException(`Could not retrieve entities: ${err.message}`);
    }
  }

  /**
   * Find entity by ID
   * @param id Entity ID
   * @param include Optional relations to include
   * @returns Entity or null if not found
   */
  async findById(id: string, include: Record<string, boolean> = {}): Promise<T | null> {
    try {
      const entity = await this.repository.findById(id);
      if (!entity) {
        this.logger.warn(`Entity with ID ${id} not found`);
        return null;
      }
      return entity;
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error finding entity with ID ${id}: ${err.message}`, err.stack); // Use err
      throw new InternalServerErrorException(`Could not retrieve entity ${id}: ${err.message}`);
    }
  }

  /**
   * Find first entity matching filter criteria
   * @param filter Filter criteria
   * @param include Optional relations to include
   * @returns Entity or null if not found
   */
  async findOne(
    filter: Record<string, any>,
    include: Record<string, boolean> = {}
  ): Promise<T | null> {
    try {
      // Use findMany with filter and take the first result
      const results = await this.repository.findMany(filter);
      return results.length > 0 ? results[0] : null;
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error finding entity: ${err.message}`, err.stack); // Use err
      throw new InternalServerErrorException(`Could not retrieve entity: ${err.message}`);
    }
  }

  /**
   * Create a new entity
   * @param data Entity data
   * @returns Created entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const entity = await this.repository.create(data);
      this.logger.log(`Created new entity with ID ${(entity as any).id}`);
      return entity;
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error creating entity: ${err.message}`, err.stack); // Use err
      throw new InternalServerErrorException(`Could not create entity: ${err.message}`);
    }
  }

  /**
   * Update an entity by ID
   * @param id Entity ID
   * @param data Updated entity data
   * @returns Updated entity
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // Check if entity exists
      const existingEntity = await this.findById(id);
      if (!existingEntity) {
        throw new Error(`Entity with ID ${id} not found`);
      }

      const updatedEntity = await this.repository.update(id, data);
      this.logger.log(`Updated entity with ID ${id}`);
      return updatedEntity;
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error updating entity with ID ${id}: ${err.message}`, err.stack); // Use err
      throw new InternalServerErrorException(`Could not update entity ${id}: ${err.message}`);
    }
  }

  /**
   * Delete an entity by ID (soft delete)
   * @param id Entity ID
   * @returns Deleted entity
   */
  async delete(id: string): Promise<T> {
    try {
      // Check if entity exists
      const existingEntity = await this.findById(id);
      if (!existingEntity) {
        throw new Error(`Entity with ID ${id} not found`);
      }

      const deletedEntity = await this.repository.delete(id);
      this.logger.log(`Deleted entity with ID ${id}`);
      return deletedEntity;
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error deleting entity with ID ${id}: ${err.message}`, err.stack); // Use err
      throw new InternalServerErrorException(`Could not delete entity ${id}: ${err.message}`);
    }
  }

  /**
   * Count entities matching filter criteria
   * @param filter Filter criteria
   * @returns Count of matching entities
   */
  async count(filter: Record<string, any> = {}): Promise<number> {
    try {
      // Use findMany to get all matches and count them
      const results = await this.repository.findMany(filter);
      return results.length;
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error counting entities: ${err.message}`, err.stack); // Use err
      throw new InternalServerErrorException(`Could not count entities: ${err.message}`);
    }
  }
}
