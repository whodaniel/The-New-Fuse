# Service Layer Consolidation

This document provides an overview of the standardized service layer architecture implemented in this project.

## Architecture Overview

The service layer follows a layered architecture pattern:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Controllers   │ ──▶ │    Services     │ ──▶ │  Repositories   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     DTOs        │     │Domain Entities  │     │Database Client  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Standardized Components

### Base Classes

These provide consistent patterns across the application:

- **BaseRepository**: Standardized CRUD operations for database access
- **BaseService**: Business logic with consistent error handling
- **BaseController**: Standardized API responses and error handling

### Core Services

Common services used throughout the application:

- **PrismaService**: Database connection management
- **AppConfigService**: Centralized configuration access
- **EventService**: Application-wide event handling
- **HealthService**: Application health monitoring

### Feature Modules

Domain-specific modules following the standardized patterns:

- **AgentModule**: Agent management functionality
- **WorkflowModule**: Workflow management functionality

### Middleware and Filters

Cross-cutting concerns:

- **RequestLoggerMiddleware**: Consistent request/response logging
- **GlobalExceptionFilter**: Standardized error responses

## API Response Format

All API endpoints return responses in this standardized format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2025-04-12T10:30:00.000Z"
}
```

Error responses follow this format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error summary",
    "details": "Detailed error information",
    "code": "ERROR_CODE"
  },
  "timestamp": "2025-04-12T10:30:00.000Z"
}
```

## Authentication and Authorization

- **JwtAuthGuard**: Protects routes requiring authentication
- **CurrentUser** decorator: Extracts authenticated user information

## Event Handling

Events follow a standard naming convention: `{entity}.{action}`

Examples:
- `agent.created`
- `agent.updated`
- `workflow.executed`

## Error Handling

Errors are handled consistently throughout the application:

1. Caught at the service layer
2. Logged with appropriate context
3. Converted to standardized API responses

## Getting Started

To extend the service layer with a new feature:

1. Create a repository class extending `BaseRepository`
2. Create a service class extending `BaseService` 
3. Create a controller class extending `BaseController`
4. Create a feature module to wire everything together
5. Add the feature module to the AppModule

## Best Practices

- Use dependency injection for all services
- Handle all exceptions in service methods
- Use standardized DTOs for data transfer
- Document public APIs with JSDoc comments
- Follow consistent naming conventions
- Use transactions for operations affecting multiple entities
- Add appropriate logging for operations and errors