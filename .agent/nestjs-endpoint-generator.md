# NestJS API Endpoint Generator

**Type:** Task-Based Agent **Focus:** Generate NestJS API endpoints following
project conventions **Scope:** Backend API development

## Capabilities

This agent specializes in:

- Creating RESTful API endpoints
- Following NestJS best practices
- Integrating with Drizzle ORM
- Implementing proper validation
- Adding authentication guards
- Writing comprehensive tests

## Task Definition

**Input:** API endpoint specification **Output:** Complete NestJS module with
controller, service, DTOs, and tests

## Usage Pattern

```typescript
// Example prompt:
"Generate a NestJS endpoint for managing workflow templates:
- GET /api/workflows/templates - List all templates
- POST /api/workflows/templates - Create new template
- PUT /api/workflows/templates/:id - Update template
- DELETE /api/workflows/templates/:id - Delete template
Include validation, authentication, and tests."
```

## Code Generation Template

### Controller Structure

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { WorkflowTemplatesService } from './workflow-templates.service';

@Controller('api/workflows/templates')
@UseGuards(JwtAuthGuard)
export class WorkflowTemplatesController {
  constructor(private readonly templatesService: WorkflowTemplatesService) {}

  @Get()
  async findAll() {
    return this.templatesService.findAll();
  }

  @Post()
  async create(@Body() createDto: CreateTemplateDto) {
    return this.templatesService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTemplateDto) {
    return this.templatesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
```

### Service Structure

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../drizzle/drizzle.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class WorkflowTemplatesService {
  constructor(private drizzle: DatabaseService) {}

  async findAll() {
    return this.drizzle.workflowTemplate.findMany();
  }

  async create(createDto: CreateTemplateDto) {
    return this.drizzle.workflowTemplate.create({
      data: createDto,
    });
  }

  async update(id: string, updateDto: UpdateTemplateDto) {
    await this.findOne(id); // Validate exists
    return this.drizzle.workflowTemplate.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Validate exists
    return this.drizzle.workflowTemplate.delete({
      where: { id },
    });
  }

  private async findOne(id: string) {
    const template = await this.drizzle.workflowTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }
}
```

### DTO Structure

```typescript
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
```

### Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowTemplatesController } from './workflow-templates.controller';
import { WorkflowTemplatesService } from './workflow-templates.service';

describe('WorkflowTemplatesController', () => {
  let controller: WorkflowTemplatesController;
  let service: WorkflowTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowTemplatesController],
      providers: [
        {
          provide: WorkflowTemplatesService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WorkflowTemplatesController>(
      WorkflowTemplatesController
    );
    service = module.get<WorkflowTemplatesService>(WorkflowTemplatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of templates', async () => {
      const result = [{ id: '1', name: 'Test Template' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(result);
      expect(await controller.findAll()).toBe(result);
    });
  });
});
```

## Quality Checklist

Before completing, ensure:

- [ ] Controller uses proper decorators
- [ ] Service implements all CRUD operations
- [ ] DTOs have validation decorators
- [ ] Error handling is implemented
- [ ] Authentication guards are applied
- [ ] Tests cover all endpoints
- [ ] Types are properly defined
- [ ] Follows project conventions from claude.md

## Integration Points

- **Drizzle:** All database operations
- **JWT Auth:** Authentication guards
- **Validation:** class-validator decorators
- **Testing:** Jest + @nestjs/testing

## Success Criteria

Generated code should:

1. Pass `pnpm run type-check`
2. Pass `pnpm run lint`
3. Pass `pnpm run test`
4. Follow NestJS conventions
5. Include comprehensive error handling
6. Have >80% test coverage
