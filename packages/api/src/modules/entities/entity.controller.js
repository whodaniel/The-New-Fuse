var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EntityController_1;
var _a, _b;
import { Controller, Get, Post, Body, // Using Patch for partial updates, Put could also be used
Param, Delete, Query, UseGuards, ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus, } from '@nestjs/common';
import { EntityService } from './entity.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { BaseController } from '../controllers/base.controller'; // Adjust path if needed
import { ServiceOrUserAuthGuard } from '../auth/guards/service-or-user-auth.guard'; // Adjust path if needed
let EntityController = EntityController_1 = class EntityController extends BaseController {
    entityService;
    constructor(entityService) {
        super(EntityController_1.name);
        this.entityService = entityService;
    }
    async create(createEntityDto) {
        // Note: entityService.createEntity performs an upsert
        return this.handleAsync(() => this.entityService.createEntity(createEntityDto), 'Failed to create/update entity');
    }
    async findAll(type, name, skip, take) {
        const where = {}; // Prisma.RegisteredEntityWhereInput
        if (type) {
            where.type = type;
        }
        if (name) {
            where.name = { contains: name, mode: 'insensitive' }; // Example: case-insensitive contains search
        }
        return this.handleAsync(() => this.entityService.findAllEntities({ skip, take, where }), 'Failed to retrieve entities');
    }
    async findOne(id) {
        return this.handleAsync(async () => {
            // Use findOneEntityOrFail to handle NotFoundException directly
            return this.entityService.findOneEntityOrFail({ id });
        }, `Failed to retrieve entity with ID ${id}
     );
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateEntityDto: UpdateEntityDto): Promise<FuseApiResponse<any>> {
    return this.handleAsync(
        () => this.entityService.updateEntity({ where: { id }, data: updateEntityDto }),` `Failed to update entity with ID ${id}`);
    }
    async remove(id) {
        return this.handleAsync(
        // removeEntity already throws NotFoundException if not found
        async () => {
            await this.entityService.removeEntity({ id });
            // Return void or an empty object for NO_CONTENT status
        }, Failed, to, delete entity);
        with (ID)
            $;
        {
            id;
        }
        `
     );
  }
}
        ;
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof CreateEntityDto !== "undefined" && CreateEntityDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query('type')),
    __param(1, Query('name')),
    __param(2, Query('skip', new DefaultValuePipe(0), ParseIntPipe)),
    __param(3, Query('take', new DefaultValuePipe(10), ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "findOne", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "remove", null);
EntityController = EntityController_1 = __decorate([
    Controller('entities'),
    UseGuards(ServiceOrUserAuthGuard) // Protect endpoints with the combined guard
    ,
    __metadata("design:paramtypes", [typeof (_a = typeof EntityService !== "undefined" && EntityService) === "function" ? _a : Object])
], EntityController);
export { EntityController };
//# sourceMappingURL=entity.controller.js.map