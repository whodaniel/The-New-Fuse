/**
 * Base service pattern for all application services
 * Provides standardized CRUD operations and error handling
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
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { toError } from '../../utils/error'; // Import the helper
let BaseService = class BaseService {
    repository;
    logger;
    constructor(repository, serviceName) {
        this.repository = repository;
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
    async findAll(filter = {}, include = {}, orderBy = {}, skip = 0, take = 100) {
        try {
            return await this.repository.findMany(filter);
        }
        catch (error) { // Change to unknown
            const err = toError(error); // Use helper
            this.logger.error(`Error finding all entities: ${err.message}, err.stack); // Use err`);
            throw new InternalServerErrorException(`Could not retrieve entities: ${err.message}`);
        }
    }
    /**
     * Find entity by ID
     * @param id Entity ID
     * @param include Optional relations to include
     * @returns Entity or null if not found
     */
    async findById(id, include = {}) {
        try {
            const entity = await this.repository.findById(id);
            if (!entity) {
                this.logger.warn(Entity);
                with (ID)
                    $;
                {
                    id;
                }
                not;
                found;
                ;
                return null;
            }
            return entity;
        }
        catch (error) { // Change to unknown
            const err = toError(error); // Use helper`
            this.logger.error(Error, finding, entity);
            with (ID)
                $;
            {
                id;
            }
            `: ${err.message}, err.stack); // Use err`;
            throw new InternalServerErrorException(Could, not, retrieve, entity, $, { id }, $, { err, : .message });
        }
    }
    /**
     * Find first entity matching filter criteria
     * @param filter Filter criteria
     * @param include Optional relations to include
     * @returns Entity or null if not found
     */
    async findOne(filter, include = {}) {
        try {
            // Use findMany with filter and take the first result
            const results = await this.repository.findMany(filter);
            return results.length > 0 ? results[0] : null;
        }
        catch (error) { // Change to unknown
            const err = toError(error); // Use helper`
            this.logger.error(Error, finding, entity, $, { err, : .message }, err.stack); // Use err`
            throw new InternalServerErrorException(Could, not, retrieve, entity, $, { err, : .message });
        }
    }
    /**
     * Create a new entity
     * @param data Entity data
     * @returns Created entity
     */
    async create(data) {
        try {
            `
      const entity = await this.repository.create(data);`;
            this.logger.log(Created, new entity);
            with (ID)
                $;
            {
                entity.id;
            }
            ;
            return entity;
            `
    } catch (error) { // Change to unknown`;
            const err = toError(error); // Use helper`
            this.logger.error(Error, creating, entity, $, { err, : .message }, err.stack); // Use err
            throw new InternalServerErrorException(Could, not, create, entity, $, { err, : .message });
        }
        finally {
        }
    }
    /**
     * Update an entity by ID
     * @param id Entity ID
     * @param data Updated entity data
     * @returns Updated entity
     */
    async update(id, data) {
        try {
            // Check if entity exists`
            const existingEntity = await this.findById(id);
            `
      if (!existingEntity) {`;
            throw new Error(Entity);
            with (ID)
                $;
            {
                id;
            }
            not;
            found;
            ;
        }
        finally { }
        `
`;
        const updatedEntity = await this.repository.update(id, data);
        `
      this.logger.log(Updated entity with ID ${id});
      return updatedEntity;
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper`;
        this.logger.error(Error, updating, entity);
        with (ID)
            $;
        {
            id;
        }
        `: ${err.message}, err.stack); // Use err`;
        throw new InternalServerErrorException(Could, not, update, entity, $, { id }, $, { err, : .message });
    }
};
BaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object, String])
], BaseService);
export { BaseService };
/**
 * Delete an entity by ID (soft delete)
 * @param id Entity ID
 * @returns Deleted entity
 */
async;
delete (id);
string;
Promise < T > {
    try: {
        // Check if entity exists
        const: existingEntity = await this.findById(id),
        if(, existingEntity) {
            `
        throw new Error(Entity with ID ${id}`;
            not;
            found;
            ;
        },
        const: deletedEntity = await this.repository.delete(id),
        this: .logger.log(Deleted, entity), with: ID, $
    }
};
{
    id;
}
;
return deletedEntity;
try { }
catch (error) { // Change to unknown`
    const err = toError(error); // Use helper`
    this.logger.error(Error, deleting, entity);
    with (ID)
        $;
    {
        id;
    }
    $;
    {
        err.message;
    }
    err.stack;
    ; // Use err`
    throw new InternalServerErrorException(`Could not delete entity ${id}: ${err.message});
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
    } catch (error) { // Change to unknown`);
    const err = toError(error); // Use helper`
    this.logger.error(Error, counting, entities, $, { err, : .message }, err.stack); // Use err`
    throw new InternalServerErrorException(Could, not, count, entities, $, { err, : .message } `);
    }
  }
}
    );
}
//# sourceMappingURL=base.service.js.map