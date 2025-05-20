import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service.js'; // Adjust path if needed
import { RegisteredEntity, Prisma } from '@prisma/client';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';

@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(private prisma: PrismaService) {}

  async createEntity(data: CreateEntityDto): Promise<RegisteredEntity> {
    this.logger.log(`Creating entity: ${data.type} - ${data.name}`);
    try {
      // Use upsert to handle potential conflicts based on unique constraint (name, type)
      // If entity exists, update it; otherwise, create it.
      const entity = await this.prisma.registeredEntity.upsert({
        where: { name_type: { name: data.name, type: data.type } },
        update: {
          metadata: data.metadata ?? Prisma.JsonNull, // Ensure metadata is updated or set to null
        },
        create: {
          name: data.name,
          type: data.type,
          metadata: data.metadata ?? Prisma.JsonNull,
        },
      });
      this.logger.log(`Successfully created/updated entity with ID: ${entity.id}`);
      return entity;
    } catch (error) {
      this.logger.error(`Failed to create/update entity ${data.type} - ${data.name}: ${error.message}`, error.stack);
      // Consider more specific error handling (e.g., Prisma known errors)
      throw error;
    }
  }

  async findAllEntities(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RegisteredEntityWhereUniqueInput;
    where?: Prisma.RegisteredEntityWhereInput;
    orderBy?: Prisma.RegisteredEntityOrderByWithRelationInput;
  }): Promise<RegisteredEntity[]> {
    const { skip, take, cursor, where, orderBy } = params;
    this.logger.debug(`Finding all entities with params: ${JSON.stringify(params)}`);
    return this.prisma.registeredEntity.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOneEntity(
    where: Prisma.RegisteredEntityWhereUniqueInput,
  ): Promise<RegisteredEntity | null> {
    this.logger.debug(`Finding one entity with where clause: ${JSON.stringify(where)}`);
    return this.prisma.registeredEntity.findUnique({
      where,
    });
  }

  async findOneEntityOrFail(
      where: Prisma.RegisteredEntityWhereUniqueInput,
  ): Promise<RegisteredEntity> {
      const entity = await this.findOneEntity(where);
      if (!entity) {
          this.logger.warn(`Entity not found with where clause: ${JSON.stringify(where)}`);
          throw new NotFoundException(`Entity not found.`);
      }
      return entity;
  }


  async updateEntity(params: {
    where: Prisma.RegisteredEntityWhereUniqueInput;
    data: UpdateEntityDto;
  }): Promise<RegisteredEntity> {
    const { where, data } = params;
    this.logger.log(`Updating entity with where clause: ${JSON.stringify(where)}`);
    try {
      const updatedEntity = await this.prisma.registeredEntity.update({
        data: {
            ...data,
            // Ensure metadata is handled correctly (explicit null vs undefined)
            metadata: data.metadata !== undefined ? data.metadata : undefined,
        },
        where,
      });
       this.logger.log(`Successfully updated entity with ID: ${updatedEntity.id}`);
      return updatedEntity;
    } catch (error) {
        // Handle Prisma error for record not found specifically
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            this.logger.warn(`Update failed: Entity not found with where clause: ${JSON.stringify(where)}`);
            throw new NotFoundException(`Entity not found.`);
        }
        this.logger.error(`Failed to update entity: ${error.message}`, error.stack);
        throw error;
    }
  }

  async removeEntity(where: Prisma.RegisteredEntityWhereUniqueInput): Promise<RegisteredEntity> {
    this.logger.log(`Removing entity with where clause: ${JSON.stringify(where)}`);
     try {
      const deletedEntity = await this.prisma.registeredEntity.delete({
        where,
      });
       this.logger.log(`Successfully removed entity with ID: ${deletedEntity.id}`);
      return deletedEntity;
    } catch (error) {
         // Handle Prisma error for record not found specifically
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            this.logger.warn(`Remove failed: Entity not found with where clause: ${JSON.stringify(where)}`);
            throw new NotFoundException(`Entity not found.`);
        }
      this.logger.error(`Failed to remove entity: ${error.message}`, error.stack);
      throw error;
    }
  }
}
