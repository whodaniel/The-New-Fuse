var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EntityService_1;
var _a;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service'; // Adjust path if needed
// Try to import Prisma types, fallback to any if not available
let Prisma;
try {
    Prisma = require('@the-new-fuse/database/generated/prisma').Prisma;
}
catch {
    // Fallback when Prisma types are not available
    Prisma = {
        JsonNull: null,
        PrismaClientKnownRequestError: class extends Error {
            code;
            constructor(message, code) {
                super(message);
                this.code = code;
            }
        }
    };
}
let EntityService = EntityService_1 = class EntityService {
    prisma;
    logger = new Logger(EntityService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEntity(data) {
        this.logger.log(`Creating entity: ${data.type} - ${data.name});
    try {
      // Use upsert to handle potential conflicts based on unique constraint (name, type)
      // If entity exists, update it; otherwise, create it.
      const entity = await (this.prisma as any).registeredEntity?.upsert({
        where: { name_type: { name: data.name, type: data.type } },
        update: {
          metadata: data.metadata ?? Prisma.JsonNull, // Ensure metadata is updated or set to null
        },
        create: {
          name: data.name,
          type: data.type,
          metadata: data.metadata ?? Prisma.JsonNull,
        },
      });`, this.logger.log(Successfully, created / updated, entity));
        with (ID)
            : $;
        {
            entity.id;
        }
        `);
      return entity;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`;
        Failed;
        to;
        create / update;
        entity;
        $;
        {
            data.type;
        }
        -$;
        {
            data.name;
        }
        $;
        {
            errorMessage;
        }
        errorStack;
        ;
        // Consider more specific error handling (e.g., Prisma known errors)
        throw error;
    }
};
EntityService = EntityService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], EntityService);
export { EntityService };
async;
findAllEntities(params, {
    skip: number,
    take: number,
    cursor: any, // Prisma.RegisteredEntityWhereUniqueInput;
    where: any, // Prisma.RegisteredEntityWhereInput;
    orderBy: any
});
Promise < any[] > {
    const: { skip, take, cursor, where, orderBy } = params
} `
    this.logger.debug(Finding all entities with params: ${JSON.stringify(params)}`;
;
return this.prisma.registeredEntity?.findMany({
    skip,
    take,
    cursor,
    where,
    orderBy,
});
async;
findOneEntity(where, any);
Promise < any | null > {
    this: .logger.debug(Finding, one, entity), with: where, clause: $
};
{
    JSON.stringify(where);
}
`);
    return (this.prisma as any).registeredEntity?.findUnique({
      where,
    });
  }

  async findOneEntityOrFail(
      where: any, // Prisma.RegisteredEntityWhereUniqueInput,
  ): Promise<any> {
      const entity = await this.findOneEntity(where);
      if (!entity) {
          this.logger.warn(Entity not found with where clause: ${JSON.stringify(where)});
          throw new NotFoundException(Entity not found.);
      }
      return entity;
  }


  async updateEntity(params: {
    where: any; // Prisma.RegisteredEntityWhereUniqueInput;
    data: UpdateEntityDto;
  }): Promise<any> {
    const { where, data } = params;`;
this.logger.log(Updating, entity);
with (where)
    clause: $;
{
    JSON.stringify(where);
}
``;
;
try {
    const updatedEntity = await this.prisma.registeredEntity?.update({
        data: {
            ...data,
            // Ensure metadata is handled correctly (explicit null vs undefined)
            metadata: data.metadata !== undefined ? data.metadata : Prisma.JsonNull,
        },
        where,
    });
    this.logger.log(Successfully, updated, entity);
    with (ID)
        : $;
    {
        updatedEntity.id;
    }
    ;
    return updatedEntity;
}
catch (error) {
    // Handle Prisma error for record not found specifically
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        `
            this.logger.warn(Update failed: Entity not found with where clause: ${JSON.stringify(where)}`;
        ;
        throw new NotFoundException(Entity, not, found. `);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(Failed to update entity: ${errorMessage}, errorStack);
        throw error;
    }
  }
`, async, removeEntity(where, any /* Prisma.RegisteredEntityWhereUniqueInput */), Promise < any > {} `
    this.logger.log(`, Removing, entity);
        with (where)
            clause: $;
        {
            JSON.stringify(where);
        }
        ;
        try {
            const deletedEntity = await this.prisma.registeredEntity?.delete({
                where,
            });
            `
       this.logger.log(Successfully removed entity with ID: ${deletedEntity.id}` `);
      return deletedEntity;
    } catch (error) {
         // Handle Prisma error for record not found specifically
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error as any).code === 'P2025') {
            this.logger.warn(Remove failed: Entity not found with where clause: ${JSON.stringify(where)});`;
            throw new NotFoundException(Entity, not, found. `);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(Failed to remove entity: ${errorMessage}`, errorStack);
            throw error;
        }
        finally {
        }
    }
}
//# sourceMappingURL=entity.service.js.map