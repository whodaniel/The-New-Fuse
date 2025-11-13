/**
 * Standardized Base Service
 * Provides consistent patterns for all services in the application
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
/**
 * Base service that can be extended by all domain services
 * Provides standardized CRUD operations
 */
let BaseService = class BaseService {
    logger;
    constructor(serviceName) {
        this.logger = new Logger(serviceName || this.constructor.name);
    }
    /**
     * Find all entities with optional filtering
     */
    async findAll(filter) {
        try {
            return await this.repository.findAll(filter);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Error finding all entities: ${errorMessage}, errorStack);
      throw error;
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T> {
    try {
      const entity = await this.repository.findById(id);
      if (!entity) {`);
            throw new NotFoundException(`Entity with ID ${id}`, not, found);
        }
        return entity;
    }
    catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(Error, finding, entity);
        with (ID)
            $;
        {
            id;
        }
        $;
        {
            errorMessage;
        }
        errorStack;
        ;
        throw error;
    }
};
BaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [String])
], BaseService);
export { BaseService };
/**
 * Find one entity by filter
 */
async;
findOne(filter, (Record));
Promise < T | null > {
    try: {
        return: await this.repository.findOne(filter)
    }, catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        `
      this.logger.error(Error finding entity: ${errorMessage}`, errorStack;
        ;
        throw error;
    }
};
/**
 * Create a new entity
 */
async;
create(data, (Partial));
Promise < T > {
    try: {
        const: entity = await this.repository.create(data),
        this: .logger.log(Created, new entity), with: ID, $
    }
};
{
    entity.id || 'unknown';
}
`);
      return entity;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(Error creating entity: ${errorMessage}, errorStack);
      throw error;
    }
  }

  /**
   * Update an entity
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const entity = await this.repository.update(id, data);`;
if (!entity) {
    `
        throw new NotFoundException(`;
    Entity;
    with (ID)
        $;
    {
        id;
    }
    not;
    found;
    ;
}
`
      this.logger.log(Updated entity with ID ${id}`;
;
return entity;
try { }
catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.logger.error(Error, updating, entity);
    with (ID)
        $;
    {
        id;
    }
    `: ${errorMessage}, errorStack);
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);`;
    this.logger.log(Deleted, entity);
    with (ID)
        $;
    {
        id;
    }
    `);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`;
    Error;
    deleting;
    entity;
    with (ID)
        $;
    {
        id;
    }
    $;
    {
        errorMessage;
    }
    errorStack;
    ;
    throw error;
}
/**
 * Count entities
 */
async;
count(filter ?  : Record);
Promise < number > {
    try: {
        return: await this.repository.count(filter)
    }, catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        `
      this.logger.error(Error counting entities: ${errorMessage}` `, errorStack);
      throw error;
    }
  }
};
    }
};
//# sourceMappingURL=base.service.js.map