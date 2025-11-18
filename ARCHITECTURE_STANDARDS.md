# Architecture Standards and Templates

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Status:** PROPOSED

This document defines the architectural standards, patterns, and templates for The New Fuse codebase.

---

## Table of Contents

1. [Package Structure Standards](#1-package-structure-standards)
2. [NestJS Module Template](#2-nestjs-module-template)
3. [API Endpoint Standards](#3-api-endpoint-standards)
4. [Database Model Standards](#4-database-model-standards)
5. [Frontend Component Standards](#5-frontend-component-standards)
6. [Testing Standards](#6-testing-standards)
7. [Error Handling Standards](#7-error-handling-standards)
8. [Documentation Standards](#8-documentation-standards)
9. [Code Style Guidelines](#9-code-style-guidelines)
10. [Import/Export Patterns](#10-importexport-patterns)

---

## 1. Package Structure Standards

### 1.1 NestJS Package Structure (REQUIRED for HTTP APIs)

```
/packages/<package-name>/
├── src/
│   ├── index.ts                    # Main exports
│   ├── <name>.module.ts           # NestJS module
│   ├── controllers/               # HTTP controllers
│   │   ├── index.ts
│   │   └── <name>.controller.ts
│   ├── services/                  # Business logic
│   │   ├── index.ts
│   │   └── <name>.service.ts
│   ├── dto/                       # Data Transfer Objects
│   │   ├── index.ts
│   │   ├── create-<name>.dto.ts
│   │   ├── update-<name>.dto.ts
│   │   └── search-<name>.dto.ts
│   ├── types/                     # TypeScript interfaces/types
│   │   └── index.ts
│   ├── guards/                    # Auth guards
│   │   └── index.ts
│   ├── interceptors/              # Request/response interceptors
│   │   └── index.ts
│   ├── filters/                   # Exception filters
│   │   └── index.ts
│   ├── decorators/                # Custom decorators
│   │   └── index.ts
│   ├── schemas/                   # Validation schemas
│   │   └── index.ts
│   └── utils/                     # Utility functions
│       └── index.ts
├── tests/
│   ├── unit/
│   │   └── <name>.service.spec.ts
│   └── integration/
│       └── <name>.controller.spec.ts
├── prisma/                        # If package has its own DB
│   └── schema.prisma
├── docs/                          # Additional documentation
│   └── api.md
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
└── README.md
```

### 1.2 Standalone Library Structure (For non-HTTP packages)

```
/packages/<package-name>/
├── src/
│   ├── index.ts                   # Main exports
│   ├── <feature>/                 # Feature-based organization
│   │   ├── index.ts
│   │   └── <feature>.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── index.ts
├── tests/
│   └── <feature>.test.ts
├── examples/                      # Usage examples
│   └── basic-usage.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### 1.3 Required Files Checklist

**Every package MUST have:**
- [ ] `README.md` with quick start and examples
- [ ] `package.json` with proper metadata
- [ ] `tsconfig.json` extending base config
- [ ] `src/index.ts` with proper exports
- [ ] Tests (unit and/or integration)
- [ ] `.eslintrc.js` (or extend root)

**Every package SHOULD have:**
- [ ] `CHANGELOG.md`
- [ ] `examples/` directory
- [ ] API documentation
- [ ] Migration guides (if breaking changes)

---

## 2. NestJS Module Template

### 2.1 Module File

**Location:** `/packages/<name>/src/<name>.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { <Name>Controller } from './controllers/<name>.controller';
import { <Name>Service } from './services/<name>.service';

/**
 * <Name> Module
 *
 * @description
 * Brief description of what this module does
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [<Name>Module],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Add other module imports here
  ],
  controllers: [
    <Name>Controller,
  ],
  providers: [
    <Name>Service,
    // Add other providers here
  ],
  exports: [
    <Name>Service,
    // Export services that other modules need
  ],
})
export class <Name>Module {}
```

### 2.2 Controller Template

**Location:** `/packages/<name>/src/controllers/<name>.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { <Name>Service } from '../services/<name>.service';
import { Create<Name>Dto, Update<Name>Dto, Search<Name>Dto } from '../dto';
import { <Name>, SearchResult } from '../types';
import { JwtAuthGuard } from '@tnf/core-auth';

/**
 * <Name> Controller
 *
 * @description
 * Handles HTTP requests for <resource> management
 */
@ApiTags('<resource>')
@Controller('api/<resource>')
@UseGuards(JwtAuthGuard) // Apply to all endpoints
export class <Name>Controller {
  private readonly logger = new Logger(<Name>Controller.name);

  constructor(
    private readonly <name>Service: <Name>Service,
  ) {}

  /**
   * Create a new <resource>
   */
  @Post()
  @ApiOperation({ summary: 'Create a new <resource>' })
  @ApiResponse({
    status: 201,
    description: '<Resource> created successfully',
    type: <Name>,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: Create<Name>Dto,
    @Req() request?: any,
  ): Promise<<Name>> {
    this.logger.log(`Creating <resource>: ${createDto.name}`);
    return this.<name>Service.create(createDto, request.user?.id);
  }

  /**
   * Search and list <resources>
   */
  @Get()
  @ApiOperation({ summary: 'Search and list <resources>' })
  @ApiResponse({
    status: 200,
    description: '<Resources> retrieved successfully',
  })
  async search(
    @Query() searchDto: Search<Name>Dto,
  ): Promise<SearchResult<<Name>>> {
    this.logger.log('Searching <resources>');
    return this.<name>Service.search(searchDto);
  }

  /**
   * Get a <resource> by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a <resource> by ID' })
  @ApiParam({ name: 'id', description: '<Resource> ID' })
  @ApiResponse({
    status: 200,
    description: '<Resource> retrieved successfully',
    type: <Name>,
  })
  @ApiResponse({ status: 404, description: '<Resource> not found' })
  async findById(@Param('id') id: string): Promise<<Name>> {
    this.logger.log(`Getting <resource>: ${id}`);
    return this.<name>Service.findById(id);
  }

  /**
   * Update a <resource>
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a <resource>' })
  @ApiParam({ name: 'id', description: '<Resource> ID' })
  @ApiResponse({
    status: 200,
    description: '<Resource> updated successfully',
    type: <Name>,
  })
  @ApiResponse({ status: 404, description: '<Resource> not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Update<Name>Dto,
  ): Promise<<Name>> {
    this.logger.log(`Updating <resource>: ${id}`);
    return this.<name>Service.update(id, updateDto);
  }

  /**
   * Delete a <resource>
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a <resource>' })
  @ApiParam({ name: 'id', description: '<Resource> ID' })
  @ApiResponse({ status: 204, description: '<Resource> deleted successfully' })
  @ApiResponse({ status: 404, description: '<Resource> not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting <resource>: ${id}`);
    await this.<name>Service.delete(id);
  }
}
```

### 2.3 Service Template

**Location:** `/packages/<name>/src/services/<name>.service.ts`

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Create<Name>Dto, Update<Name>Dto, Search<Name>Dto } from '../dto';
import { <Name>, SearchResult } from '../types';

/**
 * <Name> Service
 *
 * @description
 * Business logic for <resource> management
 */
@Injectable()
export class <Name>Service {
  private readonly logger = new Logger(<Name>Service.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new <resource>
   */
  async create(createDto: Create<Name>Dto, userId?: string): Promise<<Name>> {
    this.logger.debug(`Creating <resource> with data: ${JSON.stringify(createDto)}`);

    try {
      const <name> = await this.prisma.<name>.create({
        data: {
          ...createDto,
          createdBy: userId,
        },
      });

      return <name> as <Name>;
    } catch (error) {
      this.logger.error(`Failed to create <resource>: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search <resources>
   */
  async search(searchDto: Search<Name>Dto): Promise<SearchResult<<Name>>> {
    this.logger.debug(`Searching <resources> with filters: ${JSON.stringify(searchDto)}`);

    const { query, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    const where = {
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.<name>.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.<name>.count({ where }),
    ]);

    return {
      data: data as <Name>[],
      total,
      page,
      limit,
    };
  }

  /**
   * Find <resource> by ID
   */
  async findById(id: string): Promise<<Name>> {
    this.logger.debug(`Finding <resource> by ID: ${id}`);

    const <name> = await this.prisma.<name>.findUnique({
      where: { id },
    });

    if (!<name>) {
      throw new NotFoundException(`<Resource> not found: ${id}`);
    }

    return <name> as <Name>;
  }

  /**
   * Update <resource>
   */
  async update(id: string, updateDto: Update<Name>Dto): Promise<<Name>> {
    this.logger.debug(`Updating <resource> ${id} with data: ${JSON.stringify(updateDto)}`);

    await this.findById(id); // Verify exists

    const updated = await this.prisma.<name>.update({
      where: { id },
      data: updateDto,
    });

    return updated as <Name>;
  }

  /**
   * Delete <resource> (soft delete)
   */
  async delete(id: string): Promise<void> {
    this.logger.debug(`Deleting <resource>: ${id}`);

    await this.findById(id); // Verify exists

    await this.prisma.<name>.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### 2.4 DTO Templates

**Location:** `/packages/<name>/src/dto/create-<name>.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new <resource>
 */
export class Create<Name>Dto {
  @ApiProperty({
    description: '<Resource> name',
    example: 'Example <Name>',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: '<Resource> description',
    example: 'A detailed description of the <resource>',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tags for categorization',
    example: ['tag1', 'tag2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether the <resource> is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

**Location:** `/packages/<name>/src/dto/update-<name>.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { Create<Name>Dto } from './create-<name>.dto';

/**
 * DTO for updating a <resource>
 * All fields are optional
 */
export class Update<Name>Dto extends PartialType(Create<Name>Dto) {}
```

**Location:** `/packages/<name>/src/dto/search-<name>.dto.ts`

```typescript
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for searching <resources>
 */
export class Search<Name>Dto {
  @ApiPropertyOptional({
    description: 'Search query',
    example: 'search term',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
```

### 2.5 Types/Interfaces Template

**Location:** `/packages/<name>/src/types/index.ts`

```typescript
/**
 * <Name> interface
 */
export interface <Name> {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Search result wrapper
 */
export interface SearchResult<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 3. API Endpoint Standards

### 3.1 Route Naming Convention

**Pattern:** `/api/<resource-plural>/<id?>/<sub-resource?>`

**Examples:**
```
✅ GET    /api/resources
✅ GET    /api/resources/:id
✅ POST   /api/resources
✅ PUT    /api/resources/:id
✅ DELETE /api/resources/:id
✅ GET    /api/resources/:id/versions
✅ POST   /api/resources/:id/download
```

**Anti-patterns:**
```
❌ GET    /resources (missing /api prefix)
❌ GET    /api/resource (singular instead of plural)
❌ POST   /api/create-resource (verb in path)
❌ GET    /api/resources/list (redundant action)
```

### 3.2 HTTP Method Usage

| Method | Usage | Response Status |
|--------|-------|-----------------|
| GET | Retrieve resource(s) | 200 OK |
| POST | Create new resource | 201 Created |
| PUT | Update entire resource | 200 OK |
| PATCH | Partial update | 200 OK |
| DELETE | Delete resource | 204 No Content |

### 3.3 Response Format Standard

**Success Response:**
```typescript
{
  "id": "uuid",
  "name": "Resource Name",
  "createdAt": "2025-11-18T12:00:00Z",
  "updatedAt": "2025-11-18T12:00:00Z"
}
```

**List Response:**
```typescript
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Error Response:**
```typescript
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found",
  "timestamp": "2025-11-18T12:00:00Z",
  "path": "/api/resources/123"
}
```

### 3.4 Query Parameters Standard

**Search/Filter:**
```
GET /api/resources?query=search&category=type&page=1&limit=20
```

**Sorting:**
```
GET /api/resources?sortBy=createdAt&sortOrder=desc
```

**Pagination:**
```
GET /api/resources?page=1&limit=20
```

### 3.5 HTTP Status Codes

**Success:**
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE

**Client Errors:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation failed

**Server Errors:**
- `500 Internal Server Error` - Unexpected error
- `503 Service Unavailable` - Service temporarily down

---

## 4. Database Model Standards

### 4.1 Prisma Schema Template

```prisma
// ============================================================================
// <Model Name>
// ============================================================================

/// <Model> represents [description]
///
/// @example
/// ```typescript
/// const <model> = await prisma.<model>.create({
///   data: { name: 'Example' }
/// });
/// ```
model <Model> {
  // Primary key (REQUIRED)
  id             String      @id @default(uuid())

  // Core fields
  name           String
  description    String?

  // Metadata fields (REQUIRED)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  deletedAt      DateTime?   // Soft delete

  // Foreign keys
  userId         String?
  user           User?       @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relations
  items          Item[]

  // Indexes
  @@index([userId])
  @@index([createdAt])
  @@map("<model_table_name>") // Optional: custom table name
}
```

### 4.2 Required Fields

**Every model MUST have:**
- `id: String @id @default(uuid())`
- `createdAt: DateTime @default(now())`
- `updatedAt: DateTime @updatedAt`

**Every model SHOULD have (if applicable):**
- `deletedAt: DateTime?` (for soft delete)
- Proper foreign key relations
- Indexes on frequently queried fields

### 4.3 Naming Conventions

**Models:** PascalCase, singular
```prisma
model User {}        ✅
model Users {}       ❌
model user {}        ❌
```

**Fields:** camelCase
```prisma
createdAt            ✅
created_at           ❌
CreatedAt            ❌
```

**Relations:** camelCase, descriptive
```prisma
user          User   @relation(...)  ✅
User          User   @relation(...)  ❌
owner         User   @relation(...)  ✅
```

### 4.4 Relationship Patterns

**One-to-Many:**
```prisma
model User {
  id     String  @id @default(uuid())
  posts  Post[]
}

model Post {
  id       String  @id @default(uuid())
  userId   String
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Many-to-Many:**
```prisma
model User {
  id     String  @id @default(uuid())
  roles  UserRole[]
}

model Role {
  id     String  @id @default(uuid())
  users  UserRole[]
}

model UserRole {
  userId   String
  roleId   String
  user     User   @relation(fields: [userId], references: [id])
  role     Role   @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
  @@index([userId])
  @@index([roleId])
}
```

---

## 5. Frontend Component Standards

### 5.1 Component Template (Function Component)

**Location:** `/packages/<ui-package>/src/components/<Component>.tsx`

```typescript
import React from 'react';

/**
 * Props for <Component>
 */
export interface <Component>Props {
  /**
   * Component title
   * @example "My Component"
   */
  title: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Callback when action is triggered
   */
  onAction?: () => void;

  /**
   * Whether component is loading
   * @default false
   */
  isLoading?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Child elements
   */
  children?: React.ReactNode;
}

/**
 * <Component> - Brief description
 *
 * @description
 * Detailed description of what this component does and when to use it.
 *
 * @example
 * ```tsx
 * <Component
 *   title="Example"
 *   onAction={() => console.log('Action triggered')}
 * />
 * ```
 */
export function <Component>({
  title,
  description,
  onAction,
  isLoading = false,
  className,
  children,
}: <Component>Props): JSX.Element {
  // Implementation
  return (
    <div className={className}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

// Named export is preferred
export default <Component>;
```

### 5.2 Hook Template

```typescript
import { useState, useEffect } from 'react';

/**
 * Options for use<Hook>
 */
export interface Use<Hook>Options {
  // Options
}

/**
 * Return type for use<Hook>
 */
export interface Use<Hook>Result {
  // Return values
  data: any;
  isLoading: boolean;
  error: Error | null;
}

/**
 * use<Hook> - Brief description
 *
 * @description
 * Detailed description of what this hook does
 *
 * @example
 * ```tsx
 * const { data, isLoading } = use<Hook>({ ... });
 * ```
 */
export function use<Hook>(options: Use<Hook>Options): Use<Hook>Result {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Implementation
  }, [options]);

  return { data, isLoading, error };
}
```

### 5.3 Context/Provider Template

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context value type
 */
interface <Name>ContextValue {
  // State
  value: any;

  // Actions
  setValue: (value: any) => void;
}

/**
 * Context instance
 */
const <Name>Context = createContext<<Name>ContextValue | undefined>(undefined);

/**
 * Provider props
 */
export interface <Name>ProviderProps {
  children: React.ReactNode;
}

/**
 * <Name> Provider
 *
 * @description
 * Provides <name> context to child components
 *
 * @example
 * ```tsx
 * <Name>Provider>
 *   <App />
 * </<Name>Provider>
 * ```
 */
export function <Name>Provider({ children }: <Name>ProviderProps): JSX.Element {
  const [value, setValue] = useState<any>(null);

  const contextValue: <Name>ContextValue = {
    value,
    setValue,
  };

  return (
    <<Name>Context.Provider value={contextValue}>
      {children}
    </<Name>Context.Provider>
  );
}

/**
 * Hook to use <name> context
 *
 * @throws {Error} If used outside <Name>Provider
 */
export function use<Name>(): <Name>ContextValue {
  const context = useContext(<Name>Context);

  if (context === undefined) {
    throw new Error('use<Name> must be used within <Name>Provider');
  }

  return context;
}
```

---

## 6. Testing Standards

### 6.1 Test File Structure

**Unit Test Template:**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { <Name>Service } from './<name>.service';

describe('<Name>Service', () => {
  let service: <Name>Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [<Name>Service],
    }).compile();

    service = module.get<<Name>Service>(<Name>Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new <resource>', async () => {
      // Arrange
      const createDto = { name: 'Test <Name>' };

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test <Name>');
    });

    it('should throw error for invalid data', async () => {
      // Arrange
      const invalidDto = { name: '' };

      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return <resource> by ID', async () => {
      // Test implementation
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      // Test implementation
    });
  });
});
```

**Integration Test Template:**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('<Name>Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/<resources>', () => {
    it('should create a new <resource>', () => {
      return request(app.getHttpServer())
        .post('/api/<resources>')
        .send({ name: 'Test <Name>' })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe('Test <Name>');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/<resources>')
        .send({ name: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/<resources>/:id', () => {
    it('should return <resource> by ID', async () => {
      // Test implementation
    });

    it('should return 404 for non-existent ID', () => {
      return request(app.getHttpServer())
        .get('/api/<resources>/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
```

### 6.2 Jest Configuration

**Location:** `/packages/<name>/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 6.3 Test Coverage Requirements

**Minimum Coverage:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

**Critical Code (Required 100%):**
- Authentication/Authorization logic
- Payment processing
- Data validation
- Security-sensitive operations

---

## 7. Error Handling Standards

### 7.1 Error Handling Pattern

**Use Custom Error Classes:**

```typescript
import {
  ApplicationError,
  NetworkError,
  ValidationError,
  DatabaseError,
  ErrorSeverity,
  ErrorCategory,
} from '@tnf/core-error-handling';

// Example usage
try {
  await this.externalApi.call();
} catch (error) {
  throw new NetworkError(
    'Failed to fetch external data',
    1001,
    {
      endpoint: 'https://api.example.com',
      method: 'GET',
      statusCode: error.status,
    },
    error
  );
}
```

### 7.2 HTTP Exception Mapping

**In Controllers:**

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// Map business errors to HTTP exceptions
try {
  return await this.service.findById(id);
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof ValidationError) {
    throw new BadRequestException(error.message);
  }
  // Re-throw unexpected errors
  throw error;
}
```

### 7.3 Error Response Format

```typescript
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found",
  "timestamp": "2025-11-18T12:00:00Z",
  "path": "/api/resources/123",
  "correlationId": "uuid-here" // For tracing
}
```

---

## 8. Documentation Standards

### 8.1 README.md Template

```markdown
# <Package Name>

Brief one-line description

## Overview

Detailed description of what this package does and why it exists.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install @the-new-fuse/<package-name>
# or
pnpm add @the-new-fuse/<package-name>
\`\`\`

## Quick Start

\`\`\`typescript
import { Something } from '@the-new-fuse/<package-name>';

// Basic usage example
\`\`\`

## API Reference

### Class/Function Name

Description

**Parameters:**
- \`param1\` (Type): Description
- \`param2\` (Type): Description

**Returns:** Type - Description

**Example:**
\`\`\`typescript
// Code example
\`\`\`

## Configuration

Explain configuration options

## Examples

### Example 1: Basic Usage

\`\`\`typescript
// Code
\`\`\`

### Example 2: Advanced Usage

\`\`\`typescript
// Code
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Contributing

Link to CONTRIBUTING.md

## License

MIT
```

### 8.2 JSDoc Standards

**Functions/Methods:**
```typescript
/**
 * Brief description
 *
 * @description
 * Detailed description of what this function does
 *
 * @param {Type} paramName - Parameter description
 * @param {Type} optionalParam - Optional parameter description
 * @returns {Type} Return value description
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = myFunction('value');
 * ```
 */
function myFunction(paramName: Type, optionalParam?: Type): ReturnType {
  // Implementation
}
```

**Classes:**
```typescript
/**
 * Brief class description
 *
 * @description
 * Detailed description of the class purpose
 *
 * @example
 * ```typescript
 * const instance = new MyClass();
 * ```
 */
export class MyClass {
  // Implementation
}
```

---

## 9. Code Style Guidelines

### 9.1 TypeScript Style

**Naming Conventions:**
- Classes: `PascalCase`
- Interfaces: `PascalCase` (prefix with `I` optional)
- Types: `PascalCase`
- Functions: `camelCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Enums: `PascalCase`, members: `UPPER_SNAKE_CASE`

**Examples:**
```typescript
// Classes
class UserService {}

// Interfaces
interface User {}
interface IUserRepository {} // Optional I prefix

// Types
type UserId = string;

// Functions
function createUser() {}

// Variables
const userId = '123';
let isActive = true;

// Constants
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// Enums
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
```

### 9.2 File Naming

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Services: `kebab-case.service.ts` (e.g., `user-management.service.ts`)
- Controllers: `kebab-case.controller.ts`
- DTOs: `kebab-case.dto.ts`
- Types: `kebab-case.types.ts` or `types.ts`
- Tests: `<name>.spec.ts` or `<name>.test.ts`
- Utilities: `kebab-case.util.ts`

### 9.3 Code Organization

**Import Order:**
```typescript
// 1. External libraries
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// 2. Internal packages
import { UserService } from '@tnf/users';
import { DatabaseService } from '@tnf/database';

// 3. Relative imports - types/interfaces
import { User, CreateUserDto } from './types';

// 4. Relative imports - other
import { logger } from './utils/logger';
```

---

## 10. Import/Export Patterns

### 10.1 Index Barrel Exports

**Pattern:** Use index.ts for clean exports

**Location:** `/packages/<name>/src/index.ts`

```typescript
// Module
export * from './<name>.module';

// Services
export * from './services';

// Controllers
export * from './controllers';

// DTOs
export * from './dto';

// Types
export * from './types';

// Utils (selective export)
export { specificUtil } from './utils';
```

### 10.2 Subdirectory Exports

**Location:** `/packages/<name>/src/dto/index.ts`

```typescript
export * from './create-<name>.dto';
export * from './update-<name>.dto';
export * from './search-<name>.dto';
```

### 10.3 Import Styles

**Preferred - Named Imports:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { User, CreateUserDto } from './types';
```

**Namespace Imports (for Node.js built-ins):**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
```

**Default Imports (when necessary):**
```typescript
import matter from 'gray-matter'; // Library uses default export
```

**Avoid:**
```typescript
// ❌ Don't mix import styles unnecessarily
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import * as Server from '@modelcontextprotocol/sdk/server/index.js';
```

---

## 11. Package.json Standards

### 11.1 Required Fields

```json
{
  "name": "@the-new-fuse/<package-name>",
  "version": "1.0.0",
  "description": "Brief description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rimraf dist coverage *.tsbuildinfo",
    "test": "jest --passWithNoTests",
    "test:unit": "jest --testPathPattern=unit --passWithNoTests",
    "test:integration": "jest --testPathPattern=integration --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --passWithNoTests",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit"
  },
  "keywords": [
    "the-new-fuse",
    "<relevant-keywords>"
  ],
  "author": {
    "name": "The New Fuse Team",
    "url": "https://github.com/the-new-fuse"
  },
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 12. CI/CD Integration

### 12.1 Required Checks

All packages MUST pass:
- ✅ TypeScript compilation (`tsc --noEmit`)
- ✅ Linting (`eslint`)
- ✅ Formatting (`prettier --check`)
- ✅ Unit tests (`jest`)
- ✅ Coverage threshold (70%)

### 12.2 Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 13. Quick Reference Checklist

### New Package Checklist

When creating a new package:

- [ ] Choose correct architecture (NestJS vs Standalone)
- [ ] Create directory structure
- [ ] Set up `package.json` with standard scripts
- [ ] Configure `tsconfig.json` extending base
- [ ] Set up Jest with standard configuration
- [ ] Create comprehensive `README.md`
- [ ] Implement with proper:
  - [ ] Controllers (if NestJS)
  - [ ] Services with business logic
  - [ ] DTOs with validation
  - [ ] Type definitions
  - [ ] Error handling
  - [ ] Logging
- [ ] Write tests (unit + integration)
- [ ] Add JSDoc documentation
- [ ] Configure ESLint and Prettier
- [ ] Set up CI/CD checks
- [ ] Create examples in `/examples` directory
- [ ] Update root documentation

### Code Review Checklist

Before submitting PR:

- [ ] Follows architectural pattern (NestJS or Standalone)
- [ ] All files properly documented
- [ ] Tests written and passing
- [ ] Code coverage meets threshold (70%)
- [ ] No linting errors
- [ ] Properly formatted
- [ ] Error handling implemented
- [ ] Logging added where appropriate
- [ ] README updated
- [ ] API documentation added (if applicable)
- [ ] Migration guide included (if breaking changes)

---

## Appendix: Migration Examples

### Migrating to Standard Structure

**Before (Non-standard):**
```
/packages/my-package/
├── lib/
│   └── main.js
├── package.json
└── index.js
```

**After (Standard):**
```
/packages/my-package/
├── src/
│   ├── index.ts
│   ├── my-package.module.ts
│   ├── controllers/
│   ├── services/
│   ├── dto/
│   └── types/
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

**Document Version:** 1.0.0
**Last Review:** 2025-11-18
**Next Review:** 2026-02-18
**Maintainers:** The New Fuse Architecture Team
