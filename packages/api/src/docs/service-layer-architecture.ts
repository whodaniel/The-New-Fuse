/**
 * Service Layer Documentation
 * 
 * This file documents the standardized service layer architecture implemented in this project.
 * It provides an overview of the patterns, conventions, and best practices used.
 */

/**
 * # Service Layer Architecture
 * 
 * The service layer follows a standardized pattern with the following components:
 * 
 * ## Base Classes
 * 
 * - `BaseRepository`: Provides standardized CRUD operations for database access
 * - `BaseService`: Extends repository functionality with business logic and error handling
 * - `BaseController`: Standardizes API response formats and error handling
 * 
 * ## Core Services
 * 
 * - `PrismaService`: Manages database connections and provides the Prisma client
 * - `AppConfigService`: Centralizes access to application configuration
 * - `EventService`: Provides application-wide event handling
 * - `HealthService`: Monitors application health and dependencies
 * 
 * ## Feature Modules
 * 
 * Feature modules like `AgentModule` and `WorkflowModule` are organized around specific business domains
 * and follow the standardized patterns established by the base classes.
 * 
 * ## Middleware and Filters
 * 
 * - `RequestLoggerMiddleware`: Logs all incoming requests and their responses
 * - `GlobalExceptionFilter`: Converts exceptions to standardized API responses
 * 
 * ## API Response Format
 * 
 * All API responses follow a standardized format:
 * 
 * ```typescript
 * {
 *   success: boolean;
 *   data: T | null;
 *   error: {
 *     message: string;
 *     details?: string;
 *     code?: string;
 *   } | null;
 *   timestamp: string;
 * }
 * ```
 * 
 * ## Authentication and Authorization
 * 
 * - `JwtAuthGuard`: Protects API routes requiring authentication
 * - `CurrentUser` decorator: Extracts the authenticated user from requests
 * 
 * ## Event Handling
 * 
 * Events follow a standardized naming convention: `{entity}.{action}`
 * 
 * Examples:
 * - `agent.created`
 * - `agent.updated`
 * - `agent.deleted`
 * - `workflow.executed`
 * 
 * ## Error Handling
 * 
 * Errors are handled consistently across the application:
 * 1. Errors are caught at the service layer
 * 2. Errors are logged with appropriate context
 * 3. Standardized error responses are returned to the client
 */