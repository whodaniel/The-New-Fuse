import { IDomainEvent } from '../interfaces';
/**
 * Base event class for all command-related events
 */
export declare abstract class BaseEvent implements IDomainEvent {
    readonly id: string;
    readonly type: string;
    readonly data: any;
    readonly metadata: any;
    readonly timestamp: Date;
    readonly version: string;
    constructor(type: string, data: any, metadata?: any, version?: string);
    protected generateId(): string;
    /**
     * Serialize event to JSON
     */
    toJSON(): string;
    /**
     * Create event from JSON
     */
    static fromJSON(json: string): BaseEvent;
}
/**
 * Command execution started event
 */
export declare class CommandExecutionStartedEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        executionId: string;
        userId?: string;
        sessionId?: string;
        correlationId?: string;
    });
}
/**
 * Command execution completed event
 */
export declare class CommandExecutionCompletedEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        executionId: string;
        executionTime: number;
        success: boolean;
        result?: any;
        eventCount: number;
    });
}
/**
 * Command execution failed event
 */
export declare class CommandExecutionFailedEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        executionId: string;
        error: {
            code: string;
            message: string;
            type: string;
            stack?: string;
        };
        executionTime: number;
    });
}
/**
 * Command validation started event
 */
export declare class CommandValidationStartedEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        executionId: string;
    });
}
/**
 * Command validation completed event
 */
export declare class CommandValidationCompletedEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        executionId: string;
        isValid: boolean;
        errors: Array<{
            code: string;
            message: string;
            path?: string;
        }>;
        warnings: Array<{
            code: string;
            message: string;
            path?: string;
        }>;
    });
}
/**
 * Command handler registered event
 */
export declare class CommandHandlerRegisteredEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        handlerName: string;
        handlerType: 'handler' | 'factory';
        metadata?: any;
    });
}
/**
 * Command handler unregistered event
 */
export declare class CommandHandlerUnregisteredEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        handlerName: string;
        handlerType: 'handler' | 'factory';
    });
}
/**
 * Middleware executed event
 */
export declare class MiddlewareExecutedEvent extends BaseEvent {
    constructor(data: {
        middlewareName: string;
        commandType: string;
        executionId: string;
        executionTime: number;
        success: boolean;
        error?: string;
    });
}
/**
 * Interceptor executed event
 */
export declare class InterceptorExecutedEvent extends BaseEvent {
    constructor(data: {
        interceptorName: string;
        phase: 'before' | 'after' | 'error';
        commandType: string;
        executionId: string;
        executionTime: number;
        success: boolean;
        error?: string;
    });
}
/**
 * Domain event published event
 */
export declare class DomainEventPublishedEvent extends BaseEvent {
    constructor(data: {
        eventType: string;
        eventId: string;
        commandType: string;
        executionId: string;
        aggregateId?: string;
        aggregateType?: string;
    });
}
/**
 * Command bus statistics event
 */
export declare class CommandBusStatsEvent extends BaseEvent {
    constructor(data: {
        totalExecuted: number;
        successful: number;
        failed: number;
        averageExecutionTime: number;
        registeredHandlers: number;
        registeredMiddleware: number;
        registeredInterceptors: number;
        executionCounts: Record<string, number>;
        errorCounts: Record<string, number>;
    });
}
/**
 * Performance metrics event
 */
export declare class PerformanceMetricsEvent extends BaseEvent {
    constructor(data: {
        commandType: string;
        executionId: string;
        metrics: {
            executionTime: number;
            memoryUsage?: number;
            cpuTime?: number;
            dbQueries?: number;
            apiCalls?: number;
            customMetrics?: Record<string, any>;
        };
    });
}
/**
 * Security event
 */
export declare class SecurityEvent extends BaseEvent {
    constructor(data: {
        eventType: 'authorization' | 'authentication' | 'permission_denied' | 'security_violation';
        commandType: string;
        executionId: string;
        userId?: string;
        details: {
            reason: string;
            resource?: string;
            action?: string;
            requiredPermissions?: string[];
            userPermissions?: string[];
        };
    });
}
/**
 * Event type registry for type-safe event handling
 */
export declare class EventTypeRegistry {
    private static eventTypes;
    /**
     * Register an event type
     */
    static register(eventType: string, eventClass: any): void;
    /**
     * Get an event class by type
     */
    static get(eventType: string): any;
    /**
     * Get all registered event types
     */
    static getAll(): string[];
    /**
     * Check if an event type is registered
     */
    static has(eventType: string): boolean;
    /**
     * Create an event from type and data
     */
    static create(eventType: string, data: any): any;
}
//# sourceMappingURL=event-types.d.ts.map