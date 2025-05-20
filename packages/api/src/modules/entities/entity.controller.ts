import {
  Controller,
  Get,
  Post,
  Body,
  Patch, // Using Patch for partial updates, Put could also be used
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EntityService } from './entity.service.js';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';
import { BaseController } from '../controllers/base.controller.js'; // Adjust path if needed
import { ServiceOrUserAuthGuard } from '../auth/guards/service-or-user-auth.guard.js'; // Adjust path if needed
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { RegisteredEntity, Prisma } from '@prisma/client'; // Import Prisma
import { ApiResponse as FuseApiResponse } from '@the-new-fuse/types'; // Assuming a standard response wrapper

@ApiTags('Entities')
@Controller('entities')
@UseGuards(ServiceOrUserAuthGuard) // Protect endpoints with the combined guard
export class EntityController extends BaseController {
  constructor(private readonly entityService: EntityService) {
    super(EntityController.name);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update a registered entity (Upsert)' })
  @ApiBody({ type: CreateEntityDto })
  @ApiResponse({ status: 201, description: 'The entity has been successfully created/updated.', type: CreateEntityDto }) // Use DTO for response type example
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createEntityDto: CreateEntityDto): Promise<FuseApiResponse<RegisteredEntity>> {
    // Note: entityService.createEntity performs an upsert
    return this.handleAsync(
        () => this.entityService.createEntity(createEntityDto),
        'Failed to create/update entity'
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all registered entities' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by entity name (contains)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip (pagination)' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take (pagination)' })
  @ApiResponse({ status: 200, description: 'List of entities.', type: [CreateEntityDto] }) // Use DTO for response type example
  async findAll(
    @Query('type') type?: string,
    @Query('name') name?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take?: number,
  ): Promise<FuseApiResponse<RegisteredEntity[]>> {
     const where: Prisma.RegisteredEntityWhereInput = {};
     if (type) {
         where.type = type;
     }
     if (name) {
         where.name = { contains: name, mode: 'insensitive' }; // Example: case-insensitive contains search
     }

    return this.handleAsync(
        () => this.entityService.findAllEntities({ skip, take, where }),
        'Failed to retrieve entities'
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific registered entity by ID' })
  @ApiParam({ name: 'id', description: 'ID of the entity' })
  @ApiResponse({ status: 200, description: 'Entity details.', type: CreateEntityDto }) // Use DTO for response type example
  @ApiResponse({ status: 404, description: 'Entity not found.' })
  async findOne(@Param('id') id: string): Promise<FuseApiResponse<RegisteredEntity>> {
     return this.handleAsync(
        async () => {
            // Use findOneEntityOrFail to handle NotFoundException directly
            return this.entityService.findOneEntityOrFail({ id });
        },
        `Failed to retrieve entity with ID ${id}`
     );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific registered entity' })
  @ApiParam({ name: 'id', description: 'ID of the entity to update' })
  @ApiBody({ type: UpdateEntityDto })
  @ApiResponse({ status: 200, description: 'The entity has been successfully updated.', type: CreateEntityDto }) // Use DTO for response type example
  @ApiResponse({ status: 404, description: 'Entity not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(@Param('id') id: string, @Body() updateEntityDto: UpdateEntityDto): Promise<FuseApiResponse<RegisteredEntity>> {
    return this.handleAsync(
        () => this.entityService.updateEntity({ where: { id }, data: updateEntityDto }),
        `Failed to update entity with ID ${id}`
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific registered entity' })
  @ApiParam({ name: 'id', description: 'ID of the entity to delete' })
  @ApiResponse({ status: 204, description: 'The entity has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Entity not found.' })
  async remove(@Param('id') id: string): Promise<FuseApiResponse<void>> {
     return this.handleAsync(
        // removeEntity already throws NotFoundException if not found
        async () => {
            await this.entityService.removeEntity({ id });
            // Return void or an empty object for NO_CONTENT status
        },
        `Failed to delete entity with ID ${id}`
     );
  }
}
