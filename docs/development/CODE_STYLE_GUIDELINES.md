# Code Style Guidelines

This document outlines the comprehensive code style guidelines for The New Fuse
SaaS platform, ensuring consistency, maintainability, and quality across all
applications.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript/JavaScript](#typescriptjavascript)
- [React Components](#react-components)
- [NestJS Backend](#nestjs-backend)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Comments and Documentation](#comments-and-documentation)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Performance](#performance)
- [Security](#security)
- [Linting and Formatting](#linting-and-formatting)

## General Principles

### 1. Consistency First

- Always follow established patterns in the codebase
- Use existing utilities and helpers when available
- Maintain consistent project structure across apps

### 2. Simplicity

- Write clear, readable code
- Avoid unnecessary complexity
- Prefer simple solutions over clever ones

### 3. Testability

- Write code that is easy to test
- Use dependency injection where appropriate
- Separate business logic from UI components

### 4. Performance

- Write efficient code from the start
- Consider performance implications of decisions
- Use appropriate data structures and algorithms

### 5. Security

- Validate all inputs
- Sanitize outputs
- Use secure defaults

## TypeScript/JavaScript

### File Extensions

- **TypeScript**: `.ts` for implementation, `.tsx` for React components
- **JavaScript**: `.js` only for specific legacy cases (should be converted to
  TypeScript)
- **Type Definitions**: `.d.ts` for external library type definitions

### Type Safety

```typescript
// ✅ Good: Use strict typing
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  return {
    id: generateId(),
    createdAt: new Date(),
    ...userData,
  };
};

// ❌ Bad: Using 'any' types
const processUser = (user: any) => {
  return user.name.toUpperCase();
};
```

### Variable Declarations

```typescript
// ✅ Good: Use const/let appropriately
const API_URL = 'https://api.example.com';
let currentUser: User | null = null;

// ❌ Bad: Using var
var oldStyle = 'avoid';
```

### Function Declarations

```typescript
// ✅ Good: Explicit return types and parameter types
const formatUserName = (user: User): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

// ✅ Good: Async functions with proper error handling
const fetchUser = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new UserFetchError(`Failed to fetch user ${id}`, error);
  }
};
```

## React Components

### Component Structure

````tsx
/**
 * Dashboard component for displaying system overview
 *
 * @description
 * Renders a comprehensive dashboard with system metrics, agent status,
 * and real-time data updates. Includes error boundaries and loading states.
 *
 * @example
 * ```tsx
 * <Dashboard>
 *   <AgentSummary />
 *   <PerformanceMetrics />
 * </Dashboard>
 * ```
 *
 * @component
 * @requires AgentSummary
 * @requires PerformanceMetrics
 */
import React, { useEffect, useState, useCallback, memo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AgentSummary } from './AgentSummary';
import { PerformanceMetrics } from './PerformanceMetrics';
import type { DashboardProps, AgentData, MetricData } from '../types/dashboard';

/**
 * Props for the Dashboard component
 */
export interface DashboardProps {
  /** Initial data to display before websocket connection */
  initialData?: Partial<AgentData>;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Show/hide debug information */
  debugMode?: boolean;
  /** CSS class names */
  className?: string;
}

/**
 * Dashboard state interface
 */
interface DashboardState {
  agents: AgentData[];
  metrics: MetricData;
  isLoading: boolean;
  error: string | null;
}

/**
 * Main Dashboard component
 *
 * Displays system overview with real-time updates
 */
const Dashboard: React.FC<DashboardProps> = memo<DashboardProps>(
  ({
    initialData,
    refreshInterval = 30000,
    debugMode = false,
    className = '',
  }) => {
    // State management
    const [state, setState] = useState<DashboardState>({
      agents: initialData?.agents || [],
      metrics: initialData?.metrics || ({} as MetricData),
      isLoading: !initialData,
      error: null,
    });

    // Hooks
    const { user, hasPermission } = useAuth();
    const { isConnected, sendMessage } = useWebSocket();

    // Event handlers
    const handleAgentUpdate = useCallback((agents: AgentData[]) => {
      setState((prev) => ({ ...prev, agents, error: null }));
    }, []);

    const handleError = useCallback((error: Error) => {
      console.error('Dashboard error:', error);
      setState((prev) => ({ ...prev, error: error.message }));
    }, []);

    // Effects
    useEffect(() => {
      if (isConnected) {
        sendMessage('dashboard:subscribe', { userId: user?.id });
      }
    }, [isConnected, sendMessage, user?.id]);

    useEffect(() => {
      const interval = setInterval(() => {
        // Auto-refresh logic
      }, refreshInterval);

      return () => clearInterval(interval);
    }, [refreshInterval]);

    // Render
    if (state.isLoading) {
      return <LoadingSpinner />;
    }

    if (state.error) {
      return (
        <ErrorBoundary>
          <div className={`dashboard error ${className}`}>
            <h2>Error loading dashboard</h2>
            <p>{state.error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <div className={`dashboard ${className}`} data-testid="dashboard">
          {debugMode && <DebugPanel state={state} />}

          <header className="dashboard-header">
            <h1>System Dashboard</h1>
            <div className="status-indicators">
              <StatusIndicator connected={isConnected} label="WebSocket" />
              <StatusIndicator
                connected={user !== null}
                label="Authenticated"
              />
            </div>
          </header>

          <main className="dashboard-content">
            <section className="agents-section">
              <h2>Active Agents</h2>
              <AgentSummary agents={state.agents} />
            </section>

            <section className="metrics-section">
              <h2>Performance Metrics</h2>
              <PerformanceMetrics data={state.metrics} />
            </section>
          </main>
        </div>
      </ErrorBoundary>
    );
  }
);

// Display name for React DevTools
Dashboard.displayName = 'Dashboard';

export { Dashboard };
export type { DashboardProps, DashboardState };
````

### Hooks Guidelines

````typescript
/**
 * Custom hook for managing agent data
 *
 * @description
 * Provides a consistent interface for fetching, updating, and caching
 * agent data with automatic error handling and loading states.
 *
 * @param {string[]} agentIds - IDs of agents to fetch
 * @param {Object} options - Configuration options
 * @param {boolean} options.realTime - Enable real-time updates
 * @param {number} options.cacheTime - Cache duration in milliseconds
 *
 * @returns {Object} Hook return value with data, loading, error, and actions
 *
 * @example
 * ```typescript
 * const { agents, loading, error, refresh, selectAgent } = useAgents(
 *   ['agent-1', 'agent-2'],
 *   { realTime: true, cacheTime: 30000 }
 * );
 * ```
 */
export const useAgents = (
  agentIds: string[],
  options: {
    realTime?: boolean;
    cacheTime?: number;
  } = {}
) => {
  // Implementation...
  return {
    agents,
    loading,
    error,
    refresh,
    selectAgent,
  };
};
````

## NestJS Backend

### Controller Structure

````typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AgentService } from '../services/agent.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AgentQueryDto,
} from '../dtos/agent.dto';
import { User } from '../entities/user.entity';
import { Agent } from '../entities/agent.entity';
import type { PaginatedResult, ServiceResponse } from '../types/common';

/**
 * Controller for managing AI agents
 *
 * @description
 * Handles CRUD operations for AI agents, including creation, retrieval,
 * updating, and deletion. Provides agent collaboration features and
 * performance monitoring.
 *
 * @tags agents
 * @version 1.0
 */
@ApiTags('agents')
@Controller('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  /**
   * Create a new AI agent
   *
   * @description
   * Creates a new agent with the specified configuration and capabilities.
   * Validates input data and sets up the agent's environment.
   *
   * @param createAgentDto - Agent creation data
   * @param currentUser - Current authenticated user
   * @returns Created agent with full configuration
   *
   * @throws {ValidationError} When agent configuration is invalid
   * @throws {ConflictException} When agent with same name already exists
   *
   * @example
   * ```typescript
   * // Create a chat agent
   * const agent = await agentController.create({
   *   name: 'Customer Support Bot',
   *   type: 'chat',
   *   capabilities: ['text_generation', 'conversation'],
   *   model: 'gpt-4',
   *   systemPrompt: 'You are a helpful customer support agent...',
   * });
   * ```
   */
  @Post()
  @Roles('admin', 'agent_creator')
  @ApiOperation({
    summary: 'Create a new AI agent',
    description:
      'Creates a new agent with specified configuration and capabilities',
  })
  @ApiResponse({
    status: 201,
    description: 'Agent created successfully',
    type: Agent,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid agent configuration',
  })
  @ApiResponse({
    status: 409,
    description: 'Agent with same name already exists',
  })
  async create(
    @Body() createAgentDto: CreateAgentDto,
    @CurrentUser() currentUser: User
  ): Promise<ServiceResponse<Agent>> {
    this.logger.log(`Creating new agent: ${createAgentDto.name}`);

    try {
      const agent = await this.agentService.create(createAgentDto, currentUser);
      this.logger.log(`Agent created successfully: ${agent.id}`);

      return {
        success: true,
        data: agent,
        message: 'Agent created successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create agent: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get paginated list of agents
   *
   * @description
   * Retrieves a paginated list of agents with optional filtering
   * and sorting. Supports complex queries for agent discovery.
   *
   * @param query - Query parameters for filtering and pagination
   * @param currentUser - Current authenticated user
   * @returns Paginated result with agent data
   *
   * @example
   * ```typescript
   * // Get active chat agents
   * const result = await agentController.findAll({
   *   type: 'chat',
   *   status: 'active',
   *   page: 1,
   *   limit: 10,
   *   sortBy: 'name',
   *   sortOrder: 'ASC',
   * });
   * ```
   */
  @Get()
  @ApiOperation({
    summary: 'Get paginated list of agents',
    description: 'Retrieves agents with filtering, sorting, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'List of agents retrieved successfully',
  })
  async findAll(
    @Query() query: AgentQueryDto,
    @CurrentUser() currentUser: User
  ): Promise<ServiceResponse<PaginatedResult<Agent>>> {
    this.logger.log(`Fetching agents for user: ${currentUser.email}`);

    const result = await this.agentService.findAll(query, currentUser);

    return {
      success: true,
      data: result,
      message: 'Agents retrieved successfully',
    };
  }
}
````

### Service Structure

```typescript
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from './drizzle.service';
import { AgentRepository } from '../repositories/agent.repository';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AgentQueryDto,
} from '../dtos/agent.dto';
import { User } from '../entities/user.entity';
import { Agent } from '../entities/agent.entity';
import { AgentValidator } from '../validators/agent.validator';
import { AgentFactory } from '../factories/agent.factory';
import type { PaginatedResult, ServiceResponse } from '../types/common';

/**
 * Service for managing AI agents
 *
 * @description
 * Provides business logic for agent operations including creation,
 * validation, execution, and lifecycle management. Integrates with
 * external AI services and manages agent state.
 *
 * @since 1.0.0
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly drizzle: DatabaseService,
    private readonly agentRepository: AgentRepository,
    private readonly agentValidator: AgentValidator,
    private readonly agentFactory: AgentFactory
  ) {}

  /**
   * Create a new AI agent
   *
   * @description
   * Creates a new agent with validation, factory instantiation,
   * and database persistence. Handles all aspects of agent setup
   * including model configuration and environment variables.
   *
   * @param createAgentDto - Agent creation data
   * @param owner - Agent owner
   * @returns Created agent entity
   *
   * @throws {ValidationError} When agent configuration is invalid
   * @throws {ConflictException} When agent name already exists
   * @throws {ServiceUnavailableException} When AI service is unavailable
   */
  async create(createAgentDto: CreateAgentDto, owner: User): Promise<Agent> {
    this.logger.log(`Creating agent: ${createAgentDto.name}`);

    // Validate agent configuration
    await this.agentValidator.validateCreateDto(createAgentDto);

    // Check for name conflicts
    const existingAgent = await this.agentRepository.findByName(
      createAgentDto.name
    );
    if (existingAgent) {
      throw new ConflictException(
        `Agent with name "${createAgentDto.name}" already exists`
      );
    }

    try {
      // Create agent using factory
      const agent = await this.agentFactory.create(createAgentDto, owner);

      // Persist to database
      const savedAgent = await this.agentRepository.save(agent);

      this.logger.log(`Agent created successfully: ${savedAgent.id}`);
      return savedAgent;
    } catch (error) {
      this.logger.error(
        `Failed to create agent: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find all agents with filtering and pagination
   *
   * @description
   * Retrieves agents based on query parameters with support for
   * complex filtering, sorting, and pagination. Optimized for
   * performance with proper indexing.
   *
   * @param query - Query parameters
   * @param user - Current user for permission filtering
   * @returns Paginated result
   */
  async findAll(
    query: AgentQueryDto,
    user: User
  ): Promise<PaginatedResult<Agent>> {
    const { page = 1, limit = 20, ...filters } = query;
    const offset = (page - 1) * limit;

    this.logger.log(`Finding agents - page: ${page}, limit: ${limit}`);

    // Apply user permissions to filters
    const userFilters = {
      ...filters,
      ownerId: user.role !== 'admin' ? user.id : undefined,
    };

    // Get paginated results
    const [agents, total] = await Promise.all([
      this.agentRepository.findMany({
        where: userFilters,
        skip: offset,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          owner: {
            select: { id: true, email: true, name: true },
          },
          executions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.agentRepository.count({ where: userFilters }),
    ]);

    return {
      data: agents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
```

## File Organization

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (Button, Input, etc.)
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── common/          # Shared components
├── pages/               # Page-level components
├── hooks/               # Custom React hooks
├── services/            # API and business logic services
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── constants/           # Application constants
├── contexts/            # React contexts
├── store/               # State management (Redux, etc.)
├── assets/              # Static assets
└── styles/              # Global styles
```

### File Naming Conventions

```bash
# Components - PascalCase
UserProfile.tsx
AgentCard.tsx
DashboardMetrics.tsx

# Hooks - camelCase with "use" prefix
useAuth.ts
useAgentData.ts
useWebSocket.ts

# Services - camelCase with descriptive names
authService.ts
agentService.ts
websocketService.ts

# Utilities - camelCase, descriptive
formatDate.ts
validateEmail.ts
calculateMetrics.ts

# Constants - UPPER_SNAKE_CASE
API_ENDPOINTS.ts
ERROR_MESSAGES.ts
VALIDATION_RULES.ts

# Types - camelCase with ".types.ts" suffix
user.types.ts
agent.types.ts
api.types.ts

# Tests - Same name as tested file with ".test.ts" suffix
UserProfile.test.tsx
authService.test.ts
utils.test.ts
```

## Naming Conventions

### Variables and Functions

```typescript
// ✅ Good: Descriptive, camelCase
const activeUserList = [];
const isUserAuthenticated = true;
const getUserProfile = (userId: string) => {};

// ❌ Bad: Unclear, abbreviated
const activeUsers = [];
const isAuth = true;
const getUP = (id: string) => {};
```

### Classes and Interfaces

```typescript
// ✅ Good: PascalCase, descriptive
class UserProfileManager {}
interface UserProfileData {}
enum UserRole {}

// ❌ Bad: Unclear naming
class UPM {}
interface UPD {}
enum UR {}
```

### Constants

```typescript
// ✅ Good: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;

// ❌ Bad: Mixed case
const maxRetryAttempts = 3;
const apiBaseUrl = 'https://api.example.com';
```

### CSS Classes (BEM Methodology)

```css
/* Block */
.dashboard {
}

/* Element */
.dashboard__header {
}
.dashboard__content {
}
.dashboard__footer {
}

/* Modifier */
.dashboard--loading {
}
.dashboard__header--large {
}
.dashboard__content--full-width {
}
```

## Comments and Documentation

### JSDoc Comments

````typescript
/**
 * Formats a date string to human-readable format
 *
 * @description
 * Converts ISO date strings to localized, human-readable format
 * with support for different date styles and time zones.
 *
 * @param date - Date string in ISO format or Date object
 * @param options - Formatting options
 * @param options.locale - Locale string (default: 'en-US')
 * @param options.style - Date style: 'short', 'medium', 'long' (default: 'medium')
 * @param options.includeTime - Whether to include time (default: false)
 *
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * // Basic usage
 * formatDate('2024-01-15T10:30:00Z');
 * // Returns: "Jan 15, 2024"
 *
 * // With options
 * formatDate(new Date(), {
 *   style: 'long',
 *   includeTime: true,
 *   locale: 'en-GB'
 * });
 * // Returns: "15 January 2024 at 10:30 AM"
 * ```
 *
 * @throws {TypeError} When date parameter is invalid
 *
 * @since 2.1.0
 * @author Frontend Team
 * @see DateUtils for related functions
 */
export const formatDate = (
  date: string | Date,
  options: {
    locale?: string;
    style?: 'short' | 'medium' | 'long';
    includeTime?: boolean;
  } = {}
): string => {
  // Implementation...
};
````

### Inline Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Cache agent data to reduce API calls and improve performance
const cachedAgents = await agentCache.get(agentIds);

// Handle race condition where multiple requests might try to create the same agent
if (await agentExists(agentName)) {
  return getExistingAgent(agentName);
}

// ❌ Bad: Redundant comments
const user = getUser(); // Get user
const agents = []; // Initialize array
```

## Error Handling

### Frontend Error Boundaries

```tsx
/**
 * Error boundary component for React components
 *
 * @description
 * Catches JavaScript errors in component tree, logs them,
 * and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ComponentType<any>;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Log to error reporting service
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to monitoring service
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Backend Error Handling

```typescript
/**
 * Custom application error classes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(`Validation Error: ${field ? `${field}: ` : ''}${message}`, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`Resource not found: ${resource}${id ? ` with id ${id}` : ''}`, 404);
  }
}

/**
 * Global exception filter
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof AppError
        ? exception.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof AppError
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      success: false,
      error: {
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // Log error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception
    );

    response.status(status).json(errorResponse);
  }
}
```

## Testing

### Unit Test Structure

```typescript
describe('AgentService', () => {
  let agentService: AgentService;
  let agentRepository: jest.Mocked<AgentRepository>;
  let agentValidator: jest.Mocked<AgentValidator>;
  let agentFactory: jest.Mocked<AgentFactory>;

  beforeEach(() => {
    // Mock dependencies
    agentRepository = mock<AgentRepository>();
    agentValidator = mock<AgentValidator>();
    agentFactory = mock<AgentFactory>();

    // Create service instance
    agentService = new AgentService(
      agentRepository,
      agentValidator,
      agentFactory
    );
  });

  describe('create', () => {
    it('should create agent successfully with valid data', async () => {
      // Arrange
      const createAgentDto: CreateAgentDto = {
        name: 'Test Agent',
        type: 'chat',
        capabilities: ['text_generation'],
        model: 'gpt-4',
      };
      const user = { id: 'user-1', email: 'test@example.com' } as User;
      const expectedAgent = { id: 'agent-1', ...createAgentDto } as Agent;

      agentValidator.validateCreateDto.mockResolvedValue(undefined);
      agentRepository.findByName.mockResolvedValue(null);
      agentFactory.create.mockResolvedValue(expectedAgent);
      agentRepository.save.mockResolvedValue(expectedAgent);

      // Act
      const result = await agentService.create(createAgentDto, user);

      // Assert
      expect(result).toBe(expectedAgent);
      expect(agentValidator.validateCreateDto).toHaveBeenCalledWith(
        createAgentDto
      );
      expect(agentFactory.create).toHaveBeenCalledWith(createAgentDto, user);
    });

    it('should throw ValidationError for invalid data', async () => {
      // Arrange
      const invalidDto = { name: '' } as CreateAgentDto;
      const user = { id: 'user-1' } as User;

      agentValidator.validateCreateDto.mockRejectedValue(
        new ValidationError('Name is required', 'name')
      );

      // Act & Assert
      await expect(agentService.create(invalidDto, user)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
```

### Component Testing

```typescript
describe('Dashboard', () => {
  const defaultProps: DashboardProps = {
    initialData: { agents: [], metrics: {} },
    refreshInterval: 30000,
    debugMode: false,
  };

  const renderDashboard = (props: Partial<DashboardProps> = {}) => {
    return render(
      <ErrorBoundary>
        <Dashboard {...defaultProps} {...props} />
      </ErrorBoundary>
    );
  };

  it('should render loading state initially', () => {
    renderDashboard({ initialData: undefined });

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should render error state on failure', async () => {
    // Mock error scenario
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderDashboard({ initialData: { agents: [] } });

    // Trigger error through websocket mock
    // ...

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should display agent summary when data is available', async () => {
    const mockAgents = [
      { id: 'agent-1', name: 'Test Agent', status: 'active' },
    ];

    renderDashboard({
      initialData: {
        agents: mockAgents,
        metrics: { totalAgents: 1, activeAgents: 1 }
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
      expect(screen.getByText('Active Agents')).toBeInTheDocument();
    });
  });
});
```

## Performance

### React Performance

```typescript
/**
 * Memoize expensive calculations
 */
const ExpensiveComponent: React.FC<Props> = memo<Props>(({ data, filters }) => {
  const processedData = useMemo(() => {
    return data
      .filter(item => !filters?.hidden || item.visible)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({ ...item, processed: true }));
  }, [data, filters]);

  /**
   * Memoize callbacks to prevent unnecessary re-renders
   */
  const handleItemClick = useCallback((itemId: string) => {
    // Handle item click
  }, []);

  const handleRefresh = useCallback(() => {
    // Refresh data
  }, []);

  return (
    <div>
      {processedData.map(item => (
        <Item
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
      <RefreshButton onClick={handleRefresh} />
    </div>
  );
});

/**
 * Use React.memo for pure components
 */
const PureListItem = memo<ListItemProps>(({ item, onClick }) => {
  return (
    <div onClick={() => onClick(item.id)}>
      {item.name}
    </div>
  );
});
```

### Backend Performance

```typescript
/**
 * Database query optimization
 */
@Injectable()
export class AgentService {
  async findAgentsWithOptimizedQuery(query: AgentQueryDto) {
    // Use selective field loading
    const agents = await this.drizzle.agent.findMany({
      where: this.buildWhereClause(query),
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        // Only load necessary fields
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { [query.sortBy]: query.sortOrder },
    });

    // Use COUNT(*) for pagination
    const total = await this.drizzle.agent.count({
      where: this.buildWhereClause(query),
    });

    return { agents, total };
  }

  /**
   * Implement caching for frequently accessed data
   */
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutes
  async getAgentConfiguration(agentId: string) {
    return this.drizzle.agent.findUnique({
      where: { id: agentId },
      select: {
        config: true,
        capabilities: true,
      },
    });
  }
}
```

## Security

### Input Validation

```typescript
/**
 * Validate all user inputs
 */
class AgentValidator {
  /**
   * Validate agent creation data
   */
  async validateCreateDto(dto: CreateAgentDto): Promise<void> {
    // Validate name
    if (!dto.name || dto.name.length < 3 || dto.name.length > 100) {
      throw new ValidationError(
        'Name must be between 3 and 100 characters',
        'name'
      );
    }

    // Validate capabilities
    if (!Array.isArray(dto.capabilities) || dto.capabilities.length === 0) {
      throw new ValidationError(
        'At least one capability is required',
        'capabilities'
      );
    }

    // Sanitize inputs
    const sanitizedName = this.sanitizeString(dto.name);
    if (sanitizedName !== dto.name) {
      throw new ValidationError('Name contains invalid characters', 'name');
    }

    // Validate against whitelist
    const allowedModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3'];
    if (!allowedModels.includes(dto.model)) {
      throw new ValidationError('Invalid AI model', 'model');
    }
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['";]/g, ''); // Remove SQL injection characters
  }
}
```

### Authentication & Authorization

```typescript
/**
 * JWT Auth Guard with role-based access
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

/**
 * Role-based authorization decorator
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

## Linting and Formatting

### ESLint Configuration

```json
{
  "extends": [
    "@the-new-fuse/eslint-config",
    "@the-new-fuse/eslint-config/react",
    "@the-new-fuse/eslint-config/typescript"
  ],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error",
    "no-console": "warn",
    "complexity": ["error", 10],
    "max-lines-per-function": ["error", 50],
    "max-params": ["error", 5],
    "max-nested-callbacks": ["error", 3]
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run lint && npm run type-check && npm run test"
  }
}
```

---

This document should be updated as the codebase evolves and new patterns emerge.
All team members are responsible for maintaining these standards and suggesting
improvements when needed.

**Last Updated**: 2025-01-08  
**Version**: 1.0.0  
**Maintained by**: Development Team
