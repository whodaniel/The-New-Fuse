/**
 * Core command interface for the unified command architecture
 */
export interface ICommand<TData = any, TResult = any> {
    /**
     * Unique identifier for the command type
     */
    readonly type: string;
    /**
     * Command payload/data
     */
    readonly data: TData;
    /**
     * Command metadata
     */
    readonly metadata: CommandMetadata;
    /**
     * Execute the command with the provided context
     */
    execute(context: ICommandContext): Promise<ICommandResult<TResult>>;
    /**
     * Validate the command data and context
     */
    validate(context: ICommandContext): Promise<ValidationResult>;
}
/**
 * Command context interface providing execution environment
 */
export interface ICommandContext {
    /**
     * Unique identifier for this command execution
     */
    readonly executionId: string;
    /**
     * User or system identifier that initiated the command
     */
    readonly userId?: string;
    /**
     * Session identifier for grouping related commands
     */
    readonly sessionId?: string;
    /**
     * Timestamp when the command was created
     */
    readonly timestamp: Date;
    /**
     * Execution context data
     */
    readonly data: Record<string, any>;
    /**
     * Security/authorization context
     */
    readonly auth: AuthContext;
    /**
     * Correlation ID for tracing across services
     */
    readonly correlationId?: string;
    /**
     * Causation ID linking to the command that caused this one
     */
    readonly causationId?: string;
}
/**
 * Command result interface
 */
export interface ICommandResult<TResult = any> {
    /**
     * Whether the command execution was successful
     */
    readonly success: boolean;
    /**
     * Result data if successful
     */
    readonly data?: TResult;
    /**
     * Error information if failed
     * This will be the CommandError class instance from base/base-command.ts
     */
    readonly error?: ICommandError;
    /**
     * Metadata about the execution
     */
    readonly metadata: ResultMetadata;
    /**
     * Events that were emitted during execution
     */
    readonly events: IDomainEvent[];
}
/**
 * Command metadata
 */
export interface CommandMetadata {
    /**
     * Command version for compatibility
     */
    readonly version: string;
    /**
     * Command name
     */
    readonly name: string;
    /**
     * Command description
     */
    readonly description?: string;
    /**
     * Command category for organization
     */
    readonly category?: string;
    /**
     * Tags for command discovery and filtering
     */
    readonly tags?: string[];
    /**
     * Custom metadata properties
     */
    readonly [key: string]: any;
}
/**
 * Result metadata
 */
export interface ResultMetadata {
    /**
     * Execution duration in milliseconds
     */
    readonly executionTime: number;
    /**
     * Timestamp when execution completed
     */
    readonly completedAt: Date;
    /**
     * Number of events emitted
     */
    readonly eventCount: number;
    /**
     * Execution statistics
     */
    readonly stats?: ExecutionStats;
}
/**
 * Validation result
 */
export interface ValidationResult {
    /**
     * Whether validation passed
     */
    readonly isValid: boolean;
    /**
     * Validation errors if any
     */
    readonly errors: ValidationError[];
    /**
     * Validation warnings if any
     */
    readonly warnings: ValidationWarning[];
}
/**
 * Validation error
 */
export interface ValidationError {
    /**
     * Error code
     */
    readonly code: string;
    /**
     * Error message
     */
    readonly message: string;
    /**
     * Path to the invalid property
     */
    readonly path?: string;
    /**
     * Invalid value
     */
    readonly value?: any;
}
/**
 * Validation warning
 */
export interface ValidationWarning {
    /**
     * Warning code
     */
    readonly code: string;
    /**
     * Warning message
     */
    readonly message: string;
    /**
     * Path to the property with warning
     */
    readonly path?: string;
    /**
     * Warning value
     */
    readonly value?: any;
}
/**
 * Authentication/authorization context
 */
export interface AuthContext {
    /**
     * Whether the user is authenticated
     */
    readonly isAuthenticated: boolean;
    /**
     * User roles
     */
    readonly roles: string[];
    /**
     * User permissions
     */
    readonly permissions: string[];
    /**
     * Additional auth claims
     */
    readonly claims: Record<string, any>;
}
/**
 * Command error information interface
 */
export interface ICommandError {
    /**
     * Error code
     */
    readonly code: string;
    /**
     * Error message
     */
    readonly message: string;
    /**
     * Error type
     */
    readonly type: ErrorType;
    /**
     * Stack trace for debugging
     */
    readonly stack?: string;
    /**
     * Additional error details
     */
    readonly details?: Record<string, any>;
}
/**
 * Error types
 */
export declare enum ErrorType {
    VALIDATION = "VALIDATION",
    AUTHORIZATION = "AUTHORIZATION",
    BUSINESS_RULE = "BUSINESS_RULE",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    INTERNAL = "INTERNAL",
    EXTERNAL = "EXTERNAL"
}
/**
 * Execution statistics
 */
export interface ExecutionStats {
    /**
     * Memory usage in bytes
     */
    readonly memoryUsage?: number;
    /**
     * CPU time in milliseconds
     */
    readonly cpuTime?: number;
    /**
     * Database queries executed
     */
    readonly dbQueries?: number;
    /**
     * External API calls made
     */
    readonly apiCalls?: number;
}
/**
 * Domain event interface
 */
export interface IDomainEvent {
    /**
     * Unique event identifier
     */
    readonly id: string;
    /**
     * Event type
     */
    readonly type: string;
    /**
     * Event data
     */
    readonly data: any;
    /**
     * Event metadata
     */
    readonly metadata: EventMetadata;
    /**
     * Event timestamp
     */
    readonly timestamp: Date;
    /**
     * Event version
     */
    readonly version: string;
}
/**
 * Event metadata
 */
export interface EventMetadata {
    /**
     * ID of the command that caused this event
     */
    readonly commandId?: string;
    /**
     * ID of the aggregate that emitted this event
     */
    readonly aggregateId?: string;
    /**
     * Aggregate type
     */
    readonly aggregateType?: string;
    /**
     * Event number for this aggregate
     */
    readonly eventNumber?: number;
    /**
     * Correlation ID
     */
    readonly correlationId?: string;
    /**
     * Causation ID
     */
    readonly causationId?: string;
}
//# sourceMappingURL=command.interface.d.ts.map