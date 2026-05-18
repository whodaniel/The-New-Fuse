# The New Fuse - Technical Specification

## Project Structure

```
The New Fuse/
├── apps/
│   ├── api/                 # Backend NestJS application
│   │   ├── src/
│   │   │   ├── main.ts     # Application entry point
│   │   │   ├── app.module.ts
│   │   │   ├── auth/       # Authentication module
│   │   │   ├── users/      # User management
│   │   │   ├── tasks/      # Task management
│   │   │   └── websocket/  # WebSocket handlers
│   │   └── test/
│   └── frontend/           # React frontend application
├── packages/
│   ├── shared/            # Shared utilities and types
│   ├── ui-components/    # Shared UI components
│   └── api-client/      # API client utilities
└── tools/               # Development and deployment tools
```

## Technical Stack

### Frontend

- Framework: React 18 with TypeScript
- Build Tool: Vite
- State Management: Redux Toolkit
- Styling: Tailwind CSS
- WebSocket Client: Socket.IO Client

### Backend

- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL with Drizzle ORM
- Cache/Message Queue: Redis
- WebSocket: Socket.IO
- AI Integration: REST APIs

### DevOps

- Container Runtime: Docker
- Orchestration: Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Custom monitoring solution

## Core Components

### 1. Message Queue System

```typescript
interface Message {
  id: string;
  type: MessageType;
  payload: any;
  timestamp: number;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class MessageQueue {
  private readonly redis: Redis;
  private readonly retryLimit: number = 3;

  async enqueue(message: Message): Promise<void>;
  async dequeue(): Promise<Message | null>;
  async processMessage(message: Message): Promise<void>;
  async handleFailure(message: Message, error: Error): Promise<void>;
}
```

### 2. Agent System

```typescript
interface Agent {
  id: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  currentTask?: Task;
}

class AgentManager {
  private agents: Map<string, Agent>;

  async registerAgent(agent: Agent): Promise<void>;
  async assignTask(agentId: string, task: Task): Promise<void>;
  async getAvailableAgent(type: AgentType): Promise<Agent | null>;
}
```

### 3. Monitoring System

```typescript
interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

class MonitoringService {
  private metrics: MetricStore;

  async recordMetric(metric: Metric): Promise<void>;
  async getMetrics(query: MetricQuery): Promise<Metric[]>;
  async alertOnThreshold(metric: string, threshold: number): Promise<void>;
}
```

### 4. Error Recovery System

```typescript
interface ErrorHandler {
  handleError(error: Error): Promise<void>;
  retryOperation<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;
}

class SystemRecovery {
  private readonly errorHandler: ErrorHandler;

  async recover(error: SystemError): Promise<boolean>;
  async rollback(operation: Operation): Promise<void>;
  async validateSystemState(): Promise<SystemStatus>;
}
```

## Component System

Our component system follows atomic design principles. For detailed
documentation, see:

- [Component Overview](../components/consolidation-workflow.md)
- [Atoms Documentation](../../apps/frontend/src/components/layout/README.md)
- [Molecules Documentation](../../apps/frontend/src/components/WorkflowEditor/README.md)
- [Organisms Documentation](../../apps/frontend/src/components/WorkflowEditor/README.md)

## API Documentation

The API is fully documented in the following locations:

- [API Overview](../API_DOCUMENTATION_README.md)
- [Authentication](../security/AUTHENTICATION_SECURITY_FIX.md)
- [Endpoints](../../apps/backend/API_EXAMPLES.md)
- [WebSocket Protocol](../../apps/backend/WEBSOCKET_INTEGRATION_GUIDE.md)

## Database Schema

The database uses PostgreSQL 17.0 with Drizzle ORM. The schema is defined in
`packages/database/src/drizzle/schema/` and includes the following core tables:

### User Table

```typescript
// packages/database/src/drizzle/schema/users.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Session Table

```typescript
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Organization Table

```typescript
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Project Table

```typescript
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### ApiKey Table

```typescript
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## Database Configuration

### Local Development

- Host: localhost
- Port: 5432 (default PostgreSQL port)
- Database: fuse
- Username: postgres
- Password: postgres
- Schema: public
- Connection URL:
  `postgresql://postgres:postgres@localhost:5432/fuse?schema=public`

### Database Management

- Migrations are handled through Drizzle Kit
- Migration files are stored in `packages/database/drizzle/`
- Database schema changes should be made through Drizzle migrations
- Use `pnpm db:generate` to generate migrations from schema changes
- Use `pnpm db:migrate` to apply migrations
- Use `pnpm db:studio` to open Drizzle Studio (GUI)

## API Routes

### Authentication

- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- POST /api/auth/logout

### Users

- GET /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### Tasks

- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/:id
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

### WebSocket Events

- connection
- disconnect
- message
- taskUpdate
- agentStatus
- systemMetrics

## Security Measures

### Authentication

- JWT-based authentication
- Refresh token rotation
- HTTP-only cookies for refresh tokens
- Rate limiting on auth endpoints

### Data Protection

- Input validation using class-validator
- SQL injection prevention with Drizzle ORM
- XSS protection with React's built-in escaping
- CSRF protection with custom tokens

### Network Security

- HTTPS enforcement
- CORS configuration
- WebSocket connection validation
- Rate limiting on API endpoints

## Error Handling

### Error Types

```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

interface AppError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: Record<string, any>;
}
```

### Error Recovery

1. Automatic retry with exponential backoff
2. Circuit breaker for external services
3. Fallback mechanisms for critical operations
4. State recovery procedures

## Performance Optimization

### Caching Strategy

- Redis for session storage
- Query result caching
- Static asset caching
- Memory caching for frequent operations

### Database Optimization

- Indexed queries
- Connection pooling
- Query optimization
- Regular vacuum and analyze

### Frontend Optimization

- Code splitting
- Lazy loading
- Asset optimization
- Memory leak prevention

## Monitoring and Logging

### Metrics Collection

- System resource usage
- Request latency
- Error rates
- Business metrics

### Logging

- Structured logging format
- Log levels configuration
- Log rotation
- Error tracking

## Deployment

### Docker Configuration

```yaml
version: '3.8'
services:
  api:
    build: ./apps/api
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./apps/frontend
    environment:
      - VITE_API_URL=http://api:3001
    ports:
      - '3000:3000'

  postgres:
    image: postgres:17.0
    environment:
      - POSTGRES_DB=fuse
      - POSTGRES_USER=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
```

### CI/CD Pipeline

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push Docker images
        run: docker-compose build && docker-compose push
      - name: Deploy
        run: ./deploy.sh
```

## Development Setup

### Prerequisites

- Node.js 18+
- Bun 1.1.38
- Docker
- PostgreSQL 17.0
- Redis 7

### Installation

```bash
# Clone repository
git clone https://github.com/username/the-new-fuse.git

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Start development servers
bun dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm run test:api
pnpm run test:frontend

# Run e2e tests
pnpm run test:e2e
```

## Scaling Considerations

### Horizontal Scaling

- Stateless API design
- Redis for session storage
- Load balancer configuration
- Database replication

### Vertical Scaling

- Resource optimization
- Memory management
- Connection pooling
- Query optimization

### Monitoring and Alerts

- Resource utilization alerts
- Error rate thresholds
- Performance degradation detection
- Business metric anomalies

## Additional Technical Specifications

### Project Structure Details

```
The New Fuse/
├── apps/
│   ├── api/                 # Backend NestJS application
│   │   ├── src/
│   │   │   ├── main.ts     # Application entry point
│   │   │   ├── app.module.ts
│   │   │   ├── auth/       # Authentication module
│   │   │   ├── users/      # User management
│   │   │   ├── tasks/      # Task management
│   │   │   └── websocket/  # WebSocket handlers
│   │   └── test/
│   └── frontend/           # React frontend application
│       ├── src/
│       │   ├── main.tsx    # Application entry
│       │   ├── App.tsx     # Root component
│       │   ├── components/ # Reusable components
│       │   ├── pages/      # Page components
│       │   └── hooks/      # Custom React hooks
│       └── test/
├── packages/
│   ├── shared/            # Shared utilities and types
│   ├── ui-components/    # Shared UI components
│   └── monitoring/       # Monitoring utilities
└── tools/               # Development and deployment tools
```

### Extended Database Schema

#### Users Table

```typescript
// Drizzle schema - packages/database/src/drizzle/schema/users.ts
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);
```

#### Tasks Table

```typescript
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull(),
    priority: integer('priority').notNull(),
    assignedTo: uuid('assigned_to'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('idx_tasks_status').on(table.status),
    priorityIdx: index('idx_tasks_priority').on(table.priority),
    assignedToIdx: index('idx_tasks_assigned_to').on(table.assignedTo),
  })
);
```

#### Messages Table

```typescript
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(),
    payload: jsonb('payload'),
    status: text('status').notNull(),
    priority: integer('priority').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('idx_messages_type').on(table.type),
    statusIdx: index('idx_messages_status').on(table.status),
    priorityIdx: index('idx_messages_priority').on(table.priority),
  })
);
```

### Deployment Configuration

#### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: ./apps/api
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./apps/frontend
    environment:
      - VITE_API_URL=http://api:3001
    ports:
      - '3000:3000'

  postgres:
    image: postgres:17.0
    environment:
      - POSTGRES_DB=fuse
      - POSTGRES_USER=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
```

### CI/CD Pipeline

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: yarn install
      - name: Run tests
        run: yarn test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push Docker images
        run: docker-compose build && docker-compose push
      - name: Deploy
        run: ./deploy.sh
```

### Performance Optimization

#### Caching Strategy

- Redis for session storage
- Query result caching
- Static asset caching
- Memory caching for frequent operations

#### Database Optimization

- Indexed queries
- Connection pooling
- Query optimization
- Regular vacuum and analyze

#### Frontend Optimization

- Code splitting
- Lazy loading
- Asset optimization
- Memory leak prevention

## Technical Details & System Architecture

## Documentation Map

### Core Documentation Files

- `/docs/TECHNICAL_DETAILS.md` (this file) - Main technical specification
- `/docs/SYSTEM_DIAGRAMS.md` - Visual system architecture diagrams
- `/docs/API_DOCUMENTATION.md` - Complete API endpoint documentation
- `/docs/WEBSOCKET_PROTOCOL.md` - WebSocket message formats and protocols
- `/docs/ENVIRONMENT_VARIABLES.md` - Environment configuration details
- `/docs/RECOVERY_PROCEDURES.md` - System recovery and maintenance procedures

### Source Code Structure

```
/
├── apps/
│   ├── api/                    # Backend NestJS application
│   │   ├── src/
│   │   │   ├── main.ts        # Entry point
│   │   │   ├── app.module.ts  # Main module
│   │   │   ├── auth/          # Authentication
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.module.ts
│   │   │   ├── users/         # User management
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── users.module.ts
│   │   │   ├── tasks/         # Task management
│   │   │   │   ├── tasks.controller.ts
│   │   │   │   ├── tasks.service.ts
│   │   │   │   └── tasks.module.ts
│   │   │   └── websocket/     # WebSocket handlers
│   │   │       ├── ws.gateway.ts
│   │   │       └── ws.module.ts
│   │   ├── test/              # Backend tests
│   │   ├── package.json       # Backend dependencies
│   │   └── tsconfig.json      # TypeScript configuration
│   └── frontend/              # React frontend
│       ├── src/
│       │   ├── main.tsx       # Entry point
│       │   ├── App.tsx        # Root component
│       │   ├── components/    # Reusable components
│       │   │   ├── auth/
│       │   │   ├── tasks/
│       │   │   └── common/
│       │   ├── pages/         # Page components
│       │   │   ├── Home/
│       │   │   ├── Dashboard/
│       │   │   └── Settings/
│       │   └── hooks/         # Custom React hooks
│       ├── test/              # Frontend tests
│       ├── package.json       # Frontend dependencies
│       ├── vite.config.ts     # Vite configuration
│       └── tsconfig.json      # TypeScript configuration
├── packages/
│   ├── shared/               # Shared utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── package.json
│   ├── ui-components/       # Shared UI components
│   │   ├── src/
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   └── organisms/
│   │   └── package.json
│   └── monitoring/          # Monitoring utilities
│       ├── src/
│       │   ├── metrics/
│       │   └── alerts/
│       └── package.json
└── tools/                  # Development tools
    └── start-fuse.sh      # Startup script
```

### Configuration Files

- `/.config/env/.env` - Base environment variables
- `/apps/api/.env` - Backend-specific environment variables
- `/apps/frontend/.env` - Frontend-specific environment variables
- `/docker-compose.yml` - Docker services configuration
- `/.github/workflows/ci.yml` - CI/CD pipeline configuration

### Database Scripts

- `/apps/api/src/database/migrations/` - Database migrations
- `/apps/api/src/database/seeds/` - Database seed data
- `/apps/api/src/database/schema.sql` - Full database schema

### API Documentation

Refer to `/docs/API_DOCUMENTATION.md` for:

- Complete endpoint documentation
- Request/response formats
- Authentication flows
- Error handling

### WebSocket Protocol

Refer to `/docs/WEBSOCKET_PROTOCOL.md` for:

- Message format specifications
- Connection handling
- Event types
- Error codes

### System Architecture

Refer to `/docs/SYSTEM_DIAGRAMS.md` for visual diagrams of:

- High-level system architecture
- Message flow
- Data flow
- Component interactions
- Authentication flow
- Error recovery flow
- Monitoring system
- Deployment architecture
- Scaling architecture

### Environment Setup

Refer to `/docs/ENVIRONMENT_VARIABLES.md` for:

- Required environment variables
- Configuration options
- Environment-specific settings
- Security considerations

### Recovery Procedures

Refer to `/docs/RECOVERY_PROCEDURES.md` for:

- Incident response protocols
- Recovery procedures
- Prevention measures
- Testing procedures

## Getting Started with Documentation

### Step 1: System Overview

1. Start with `/docs/TECHNICAL_DETAILS.md` (this file) for:
   - Complete technical specifications
   - System architecture
   - Project structure
   - Implementation details

2. Review `/docs/SYSTEM_DIAGRAMS.md` for visual understanding of:
   - System components and their interactions
   - Data and message flows
   - Deployment architecture

### Step 2: Implementation Details

1. API Implementation:
   - Read `/docs/API_DOCUMENTATION.md`
   - Review `/apps/api/src/` for implementation
   - Check `/apps/api/src/database/` for database schema

2. Frontend Implementation:
   - Start with `/apps/frontend/src/`
   - Review component structure in `/apps/frontend/src/components/`
   - Check page implementations in `/apps/frontend/src/pages/`

3. Shared Code:
   - Review `/packages/shared/` for common utilities
   - Check `/packages/ui-components/` for reusable UI components
   - Examine `/packages/core-monitoring/` for monitoring implementation
   - Note: `/packages/monitoring/` was sunset and removed on 2026-05-17

### Step 3: Configuration

1. Environment Setup:
   - Follow `/docs/ENVIRONMENT_VARIABLES.md`
   - Configure `.env` files in respective directories
   - Set up database using schema in `/apps/api/src/database/schema.sql`

2. Development Environment:
   - Install dependencies from `package.json` files
   - Configure TypeScript using `tsconfig.json` files
   - Set up development tools from `/tools/`

### Step 4: Testing and Deployment

1. Testing:
   - Review test files in `/apps/api/test/` and `/apps/frontend/test/`
   - Follow testing procedures in documentation

2. Deployment:
   - Use Docker configuration in `/docker-compose.yml`
   - Follow CI/CD setup in `/.github/workflows/ci.yml`
