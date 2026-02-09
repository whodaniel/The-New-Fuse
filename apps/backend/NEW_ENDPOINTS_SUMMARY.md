# New Fuse Backend - REST API Endpoints Summary

## Overview
This document outlines the new high-value REST API endpoints added to the Fuse backend, including DTOs, validation rules, and test coverage.

---

## 1. User Profile Management

### Endpoints

#### GET /api/users/:id/profile
- **Description**: Retrieve detailed user profile information
- **Authentication**: Required (JWT)
- **Authorization**: User can access their own profile or admin can access any
- **Response**: ProfileResponseDto

#### PUT /api/users/:id/profile
- **Description**: Update user profile information including bio, avatar, and preferences
- **Authentication**: Required (JWT)
- **Authorization**: User can update their own profile
- **Request Body**: UpdateProfileDto
- **Response**: ProfileResponseDto

### DTOs

#### UpdateProfileDto
```typescript
{
  displayName?: string;      // Max 100 chars
  bio?: string;             // Max 500 chars
  avatarUrl?: string;       // Valid URL
  location?: string;        // Max 100 chars
  company?: string;         // Max 100 chars
  website?: string;         // Valid URL
  preferences?: Record<string, any>;
}
```

**Validation Rules**:
- `displayName`: Optional string, max length 100
- `bio`: Optional string, max length 500
- `avatarUrl`: Optional valid URL
- `location`: Optional string, max length 100
- `company`: Optional string, max length 100
- `website`: Optional valid URL
- `preferences`: Optional object for user settings

#### ProfileResponseDto
```typescript
{
  id: string;
  email: string;
  name: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  company?: string;
  website?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tests
- ✅ Get user profile - success case
- ✅ Get user profile - user not found
- ✅ Update user profile - full update
- ✅ Update user profile - partial update

**Location**: `/home/user/fuse/apps/backend/src/users/users.controller.spec.ts`

---

## 2. Agent Execution History

### Endpoints

#### GET /api/agents/executions
- **Description**: Retrieve paginated list of agent execution records with optional filtering
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `agentId`: Filter by agent ID
  - `status`: Filter by execution status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
  - `userId`: Filter by user ID
  - `startDate`: Filter by start date (ISO 8601)
  - `endDate`: Filter by end date (ISO 8601)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
- **Response**: AgentExecutionListResponseDto

#### GET /api/agents/executions/:id
- **Description**: Retrieve detailed information about a specific agent execution
- **Authentication**: Required (JWT)
- **Response**: AgentExecutionResponseDto

### DTOs

#### AgentExecutionQueryDto
```typescript
{
  agentId?: string;
  status?: ExecutionStatus;
  userId?: string;
  startDate?: string;     // ISO 8601
  endDate?: string;       // ISO 8601
  page?: number;          // Min: 1
  limit?: number;         // Min: 1
}
```

**Validation Rules**:
- `status`: Optional enum (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- `startDate`: Optional ISO 8601 date string
- `endDate`: Optional ISO 8601 date string
- `page`: Optional number, minimum 1
- `limit`: Optional number, minimum 1

#### AgentExecutionResponseDto
```typescript
{
  id: string;
  agentId: string;
  agentName: string;
  userId: string;
  status: ExecutionStatus;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;      // milliseconds
  createdAt: Date;
}
```

#### AgentExecutionListResponseDto
```typescript
{
  executions: AgentExecutionResponseDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Tests
- ✅ Get paginated execution history
- ✅ Filter by agent ID
- ✅ Filter by status
- ✅ Get single execution details

**Location**: `/home/user/fuse/apps/backend/src/modules/agent-executions/agent-executions.controller.spec.ts`

---

## 3. Workflow Templates

### Endpoints

#### GET /api/workflows/templates
- **Description**: Retrieve all available workflow templates
- **Authentication**: Required (JWT)
- **Response**: WorkflowTemplateResponseDto[]

#### GET /api/workflows/templates/:id
- **Description**: Retrieve a specific workflow template by ID
- **Authentication**: Required (JWT)
- **Response**: WorkflowTemplateResponseDto

#### POST /api/workflows/templates
- **Description**: Create a new workflow template
- **Authentication**: Required (JWT)
- **Request Body**: CreateWorkflowTemplateDto
- **Response**: WorkflowTemplateResponseDto

#### PUT /api/workflows/templates/:id
- **Description**: Update an existing workflow template
- **Authentication**: Required (JWT)
- **Request Body**: UpdateWorkflowTemplateDto
- **Response**: WorkflowTemplateResponseDto

#### DELETE /api/workflows/templates/:id
- **Description**: Delete a workflow template
- **Authentication**: Required (JWT)
- **Response**: 204 No Content

### DTOs

#### CreateWorkflowTemplateDto
```typescript
{
  name: string;           // Required, max 200 chars
  description: string;    // Required, max 1000 chars
  category?: string;
  template: Record<string, any>;  // Required
  tags?: string[];
  isPublic?: boolean;
}
```

**Validation Rules**:
- `name`: Required string, max length 200
- `description`: Required string, max length 1000
- `category`: Optional string
- `template`: Required object (workflow definition)
- `tags`: Optional array of strings
- `isPublic`: Optional boolean

#### UpdateWorkflowTemplateDto
```typescript
{
  name?: string;          // Max 200 chars
  description?: string;   // Max 1000 chars
  category?: string;
  template?: Record<string, any>;
  tags?: string[];
  isPublic?: boolean;
}
```

#### WorkflowTemplateResponseDto
```typescript
{
  id: string;
  name: string;
  description: string;
  category?: string;
  template: Record<string, any>;
  tags?: string[];
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tests
- ✅ Get all templates
- ✅ Get template by ID
- ✅ Create new template
- ✅ Update existing template
- ✅ Delete template

**Location**: `/home/user/fuse/apps/backend/src/modules/workflow-templates/workflow-templates.controller.spec.ts`

---

## 4. File Upload/Download

### Endpoints

#### POST /api/files/upload
- **Description**: Upload a file to the server (max 10MB)
- **Authentication**: Required (JWT)
- **Content-Type**: multipart/form-data
- **Request**: File in 'file' field
- **Response**: FileUploadResponseDto

#### GET /api/files
- **Description**: Get paginated list of user's uploaded files
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `category`: Filter by file category
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
- **Response**: FileListResponseDto

#### GET /api/files/:id
- **Description**: Download a specific file
- **Authentication**: Required (JWT)
- **Response**: File stream or FileUploadResponseDto

#### DELETE /api/files/:id
- **Description**: Delete a file
- **Authentication**: Required (JWT)
- **Response**: 204 No Content

### DTOs

#### FileCategory Enum
```typescript
enum FileCategory {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER'
}
```

#### FileUploadResponseDto
```typescript
{
  id: string;
  filename: string;
  mimeType: string;
  size: number;           // bytes
  category: FileCategory;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}
```

#### FileListQueryDto
```typescript
{
  category?: FileCategory;
  page?: number;          // Min: 1
  limit?: number;         // Min: 1
}
```

**Validation Rules**:
- `category`: Optional enum (DOCUMENT, IMAGE, VIDEO, AUDIO, ARCHIVE, OTHER)
- `page`: Optional number, minimum 1
- `limit`: Optional number, minimum 1
- File size limit: 10MB

#### FileListResponseDto
```typescript
{
  files: FileUploadResponseDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Tests
- ✅ Upload file successfully
- ✅ Upload file - no file provided error
- ✅ Upload file - size exceeds limit error
- ✅ Get paginated file list
- ✅ Download file
- ✅ Delete file

**Location**: `/home/user/fuse/apps/backend/src/modules/files/files.controller.spec.ts`

---

## 5. System Health Metrics

### Endpoints

#### GET /api/system/metrics
- **Description**: Get comprehensive system health and performance metrics (Admin only)
- **Authentication**: Required (JWT)
- **Authorization**: Admin role required
- **Response**: SystemMetricsResponseDto

#### GET /api/system/health
- **Description**: Quick health check for system status monitoring
- **Authentication**: Required (JWT)
- **Response**: HealthCheckDto

### DTOs

#### SystemMetricsResponseDto
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;         // seconds
  timestamp: Date;
  memory: MemoryMetricsDto;
  cpu: CpuMetricsDto;
  database: DatabaseMetricsDto;
  api: ApiMetricsDto;
  services: ServiceHealthDto[];
  version?: string;
  environment?: string;
}
```

#### MemoryMetricsDto
```typescript
{
  total: number;          // bytes
  used: number;           // bytes
  free: number;           // bytes
  usagePercent: number;
}
```

#### CpuMetricsDto
```typescript
{
  cores: number;
  usagePercent: number;
  loadAverage: number;
}
```

#### DatabaseMetricsDto
```typescript
{
  status: string;
  activeConnections: number;
  totalQueries: number;
  avgQueryTime: number;   // milliseconds
}
```

#### ApiMetricsDto
```typescript
{
  totalRequests: number;
  requestsPerMinute: number;
  avgResponseTime: number;  // milliseconds
  errorRate: number;        // percentage
  statusCodeDistribution?: Record<string, number>;
}
```

#### ServiceHealthDto
```typescript
{
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;    // milliseconds
  lastCheck?: Date;
  message?: string;
}
```

### Tests
- ✅ Get comprehensive system metrics - healthy status
- ✅ Get system metrics - degraded status
- ✅ Get basic health check
- ✅ Get health check - unhealthy status

**Location**: `/home/user/fuse/apps/backend/src/modules/system-metrics/system-metrics.controller.spec.ts`

---

## Architecture & Implementation Details

### Error Handling
All endpoints implement proper error handling with:
- HTTP status codes (200, 201, 204, 400, 404, 500)
- Descriptive error messages
- Validation errors with field-level details

### Swagger/OpenAPI Documentation
All endpoints are fully documented with:
- `@ApiTags` for grouping
- `@ApiOperation` for descriptions
- `@ApiResponse` for response schemas
- `@ApiBearerAuth` for authentication requirements
- `@ApiProperty` and `@ApiPropertyOptional` for DTO documentation

### Authentication & Authorization
- All endpoints require JWT authentication via `@UseGuards(JwtAuthGuard)`
- Admin-only endpoints use `@Roles('admin')` decorator
- User-scoped operations validate ownership

### Validation
All input DTOs use class-validator decorators:
- `@IsNotEmpty()` for required fields
- `@IsString()`, `@IsNumber()`, `@IsBoolean()` for type validation
- `@IsEmail()`, `@IsUrl()` for format validation
- `@MaxLength()`, `@Min()` for constraints
- `@IsEnum()` for enumerated values
- `@IsOptional()` for optional fields

### Module Structure
```
apps/backend/src/
├── users/
│   ├── dto/
│   │   ├── user.dto.ts
│   │   └── profile.dto.ts
│   ├── users.controller.ts
│   ├── users.controller.spec.ts
│   ├── users.service.ts
│   └── users.module.ts
├── modules/
│   ├── agent-executions/
│   │   ├── dto/
│   │   │   └── agent-execution.dto.ts
│   │   ├── agent-executions.controller.ts
│   │   ├── agent-executions.controller.spec.ts
│   │   ├── agent-executions.service.ts
│   │   └── agent-executions.module.ts
│   ├── workflow-templates/
│   │   ├── dto/
│   │   │   └── workflow-template.dto.ts
│   │   ├── workflow-templates.controller.ts
│   │   ├── workflow-templates.controller.spec.ts
│   │   ├── workflow-templates.service.ts
│   │   └── workflow-templates.module.ts
│   ├── files/
│   │   ├── dto/
│   │   │   └── file.dto.ts
│   │   ├── files.controller.ts
│   │   ├── files.controller.spec.ts
│   │   ├── files.service.ts
│   │   └── files.module.ts
│   └── system-metrics/
│       ├── dto/
│       │   └── system-metrics.dto.ts
│       ├── system-metrics.controller.ts
│       ├── system-metrics.controller.spec.ts
│       ├── system-metrics.service.ts
│       └── system-metrics.module.ts
└── app.module.ts (updated with new modules)
```

---

## Testing Summary

### Test Coverage
- **User Profile Management**: 4 test cases
- **Agent Execution History**: 4 test cases
- **Workflow Templates**: 5 test cases
- **File Upload/Download**: 6 test cases
- **System Health Metrics**: 4 test cases

**Total**: 23 test cases covering all new endpoints

### Test Files Created
1. `/home/user/fuse/apps/backend/src/users/users.controller.spec.ts`
2. `/home/user/fuse/apps/backend/src/modules/agent-executions/agent-executions.controller.spec.ts`
3. `/home/user/fuse/apps/backend/src/modules/workflow-templates/workflow-templates.controller.spec.ts`
4. `/home/user/fuse/apps/backend/src/modules/files/files.controller.spec.ts`
5. `/home/user/fuse/apps/backend/src/modules/system-metrics/system-metrics.controller.spec.ts`

---

## Next Steps

### Integration with Database
Current implementation uses mock data. To integrate with a real database:

1. **Update Prisma Schema** - Add models for:
   - UserProfile (or extend User model)
   - AgentExecution
   - WorkflowTemplate
   - File

2. **Implement Database Queries** - Replace mock data in services with Prisma queries

3. **Add Migrations** - Run `prisma migrate dev` to apply schema changes

### File Storage Integration
The file upload module is ready but needs integration with:
- AWS S3, Google Cloud Storage, or similar
- Local file system storage
- CDN for file delivery

### Monitoring Integration
System metrics can be enhanced by integrating with:
- Prometheus for metrics collection
- Grafana for visualization
- Application Performance Monitoring (APM) tools

---

## Accessing Swagger Documentation

Once the backend is running, access the API documentation at:
```
http://localhost:3004/api/docs
```

This provides interactive API documentation with the ability to test endpoints directly from the browser.

---

## Summary

### Endpoints Created: 13
1. GET /api/users/:id/profile
2. PUT /api/users/:id/profile
3. GET /api/agents/executions
4. GET /api/agents/executions/:id
5. GET /api/workflows/templates
6. GET /api/workflows/templates/:id
7. POST /api/workflows/templates
8. PUT /api/workflows/templates/:id
9. DELETE /api/workflows/templates/:id
10. POST /api/files/upload
11. GET /api/files
12. GET /api/files/:id
13. DELETE /api/files/:id
14. GET /api/system/metrics
15. GET /api/system/health

### DTOs Created: 17
1. UpdateProfileDto
2. ProfileResponseDto
3. AgentExecutionQueryDto
4. AgentExecutionResponseDto
5. AgentExecutionListResponseDto
6. CreateWorkflowTemplateDto
7. UpdateWorkflowTemplateDto
8. WorkflowTemplateResponseDto
9. FileUploadResponseDto
10. FileListQueryDto
11. FileListResponseDto
12. SystemMetricsResponseDto
13. MemoryMetricsDto
14. CpuMetricsDto
15. DatabaseMetricsDto
16. ApiMetricsDto
17. ServiceHealthDto

### Tests Created: 23
Comprehensive unit tests for all controllers covering success and error scenarios.

### Modules Created: 4
1. AgentExecutionsModule
2. WorkflowTemplatesModule
3. FilesModule
4. SystemMetricsModule
