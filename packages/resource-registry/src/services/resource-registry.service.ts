import { Injectable, Logger } from '@nestjs/common';

import { CreateResourceDto, SearchResourceDto, UpdateResourceDto } from '../dto';
import { Resource, ResourceAction, SearchResult } from '../types/index.js';

@Injectable()
export class ResourceRegistryService {
  private readonly logger = new Logger(ResourceRegistryService.name);

  constructor() {
    // Database initialization would go here (e.g. Drizzle)
  }

  async onModuleDestroy() {
    // Cleanup
  }

  /**
   * Create a new resource
   */
  async create(dto: CreateResourceDto): Promise<Resource> {
    this.logger.log(`Creating resource: ${dto.name}`);
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Find resource by ID
   */
  async findById(id: string): Promise<Resource> {
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Search resources with filters, sorting, and pagination
   */
  async search(dto: SearchResourceDto): Promise<SearchResult<Resource>> {
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Update a resource
   */
  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    this.logger.log(`Updating resource: ${id}`);
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Delete a resource (soft delete)
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting resource: ${id}`);
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Log resource access
   */
  async logAccess(
    resourceId: string,
    action: ResourceAction,
    accessorId?: string,
    accessorType: string = 'system',
    metadata?: any
  ): Promise<void> {
    // Silently fail for logs during migration? Or throw?
    // Throwing is safer to detect usage.
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Get resource versions
   */
  async getVersions(resourceId: string): Promise<any[]> {
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }

  /**
   * Get specific version
   */
  async getVersion(resourceId: string, version: string): Promise<any> {
    throw new Error('Method not implemented. Migration to Drizzle required.');
  }
}
