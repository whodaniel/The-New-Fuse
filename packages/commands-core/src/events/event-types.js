"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeRegistry = exports.SecurityEvent = exports.PerformanceMetricsEvent = exports.CommandBusStatsEvent = exports.DomainEventPublishedEvent = exports.InterceptorExecutedEvent = exports.MiddlewareExecutedEvent = exports.CommandHandlerUnregisteredEvent = exports.CommandHandlerRegisteredEvent = exports.CommandValidationCompletedEvent = exports.CommandValidationStartedEvent = exports.CommandExecutionFailedEvent = exports.CommandExecutionCompletedEvent = exports.CommandExecutionStartedEvent = exports.BaseEvent = void 0;
/**
 * Base event class for all command-related events
 */
class BaseEvent {
    id;
    type;
    data;
    metadata;
    timestamp;
    version;
    constructor(type, data, metadata = {}, version = '1.0.0') {
        this.id = this.generateId();
        this.type = type;
        this.data = data;
        this.metadata = metadata;
        this.timestamp = new Date();
        this.version = version;
    }
    generateId() {
        // Simple ID generation - can be replaced with more sophisticated methods
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Serialize event to JSON
     */
    toJSON() {
        return JSON.stringify({
            id: this.id,
            type: this.type,
            data: this.data,
            metadata: this.metadata,
            timestamp: this.timestamp.toISOString(),
            version: this.version
        });
    }
    /**
     * Create event from JSON
     */
    static fromJSON(json) {
        const parsed = JSON.parse(json);
        return new this(parsed.type, parsed.data, parsed.metadata, parsed.version);
    }
}
exports.BaseEvent = BaseEvent;
/**
 * Command execution started event
 */
class CommandExecutionStartedEvent extends BaseEvent {
    constructor(data) {
        super('command.execution.started', data, {
            category: 'command',
            severity: 'info'
        });
    }
}
exports.CommandExecutionStartedEvent = CommandExecutionStartedEvent;
/**
 * Command execution completed event
 */
class CommandExecutionCompletedEvent extends BaseEvent {
    constructor(data) {
        super('command.execution.completed', data, {
            category: 'command',
            severity: 'info'
        });
    }
}
exports.CommandExecutionCompletedEvent = CommandExecutionCompletedEvent;
/**
 * Command execution failed event
 */
class CommandExecutionFailedEvent extends BaseEvent {
    constructor(data) {
        super('command.execution.failed', data, {
            category: 'command',
            severity: 'error'
        });
    }
}
exports.CommandExecutionFailedEvent = CommandExecutionFailedEvent;
/**
 * Command validation started event
 */
class CommandValidationStartedEvent extends BaseEvent {
    constructor(data) {
        super('command.validation.started', data, {
            category: 'validation',
            severity: 'debug'
        });
    }
}
exports.CommandValidationStartedEvent = CommandValidationStartedEvent;
/**
 * Command validation completed event
 */
class CommandValidationCompletedEvent extends BaseEvent {
    constructor(data) {
        super('command.validation.completed', data, {
            category: 'validation',
            severity: 'debug'
        });
    }
}
exports.CommandValidationCompletedEvent = CommandValidationCompletedEvent;
/**
 * Command handler registered event
 */
class CommandHandlerRegisteredEvent extends BaseEvent {
    constructor(data) {
        super('command.handler.registered', data, {
            category: 'registry',
            severity: 'info'
        });
    }
}
exports.CommandHandlerRegisteredEvent = CommandHandlerRegisteredEvent;
/**
 * Command handler unregistered event
 */
class CommandHandlerUnregisteredEvent extends BaseEvent {
    constructor(data) {
        super('command.handler.unregistered', data, {
            category: 'registry',
            severity: 'info'
        });
    }
}
exports.CommandHandlerUnregisteredEvent = CommandHandlerUnregisteredEvent;
/**
 * Middleware executed event
 */
class MiddlewareExecutedEvent extends BaseEvent {
    constructor(data) {
        super('middleware.executed', data, {
            category: 'middleware',
            severity: 'debug'
        });
    }
}
exports.MiddlewareExecutedEvent = MiddlewareExecutedEvent;
/**
 * Interceptor executed event
 */
class InterceptorExecutedEvent extends BaseEvent {
    constructor(data) {
        super('interceptor.executed', data, {
            category: 'interceptor',
            severity: 'debug'
        });
    }
}
exports.InterceptorExecutedEvent = InterceptorExecutedEvent;
/**
 * Domain event published event
 */
class DomainEventPublishedEvent extends BaseEvent {
    constructor(data) {
        super('domain.event.published', data, {
            category: 'event',
            severity: 'debug'
        });
    }
}
exports.DomainEventPublishedEvent = DomainEventPublishedEvent;
/**
 * Command bus statistics event
 */
class CommandBusStatsEvent extends BaseEvent {
    constructor(data) {
        super('command.bus.stats', data, {
            category: 'metrics',
            severity: 'info'
        });
    }
}
exports.CommandBusStatsEvent = CommandBusStatsEvent;
/**
 * Performance metrics event
 */
class PerformanceMetricsEvent extends BaseEvent {
    constructor(data) {
        super('performance.metrics', data, {
            category: 'performance',
            severity: 'debug'
        });
    }
}
exports.PerformanceMetricsEvent = PerformanceMetricsEvent;
/**
 * Security event
 */
class SecurityEvent extends BaseEvent {
    constructor(data) {
        super('security.event', data, {
            category: 'security',
            severity: data.eventType === 'security_violation' ? 'warning' : 'info'
        });
    }
}
exports.SecurityEvent = SecurityEvent;
/**
 * Event type registry for type-safe event handling
 */
class EventTypeRegistry {
    static eventTypes = new Map();
    /**
     * Register an event type
     */
    static register(eventType, eventClass) {
        this.eventTypes.set(eventType, eventClass);
    }
    /**
     * Get an event class by type
     */
    static get(eventType) {
        return this.eventTypes.get(eventType);
    }
    /**
     * Get all registered event types
     */
    static getAll() {
        return Array.from(this.eventTypes.keys());
    }
    /**
     * Check if an event type is registered
     */
    static has(eventType) {
        return this.eventTypes.has(eventType);
    }
    /**
     * Create an event from type and data
     */
    static create(eventType, data) {
        const EventClass = this.eventTypes.get(eventType);
        if (!EventClass) {
            return undefined;
        }
        return new EventClass(data);
    }
}
exports.EventTypeRegistry = EventTypeRegistry;
// Register all built-in event types
EventTypeRegistry.register('command.execution.started', CommandExecutionStartedEvent);
EventTypeRegistry.register('command.execution.completed', CommandExecutionCompletedEvent);
EventTypeRegistry.register('command.execution.failed', CommandExecutionFailedEvent);
EventTypeRegistry.register('command.validation.started', CommandValidationStartedEvent);
EventTypeRegistry.register('command.validation.completed', CommandValidationCompletedEvent);
EventTypeRegistry.register('command.handler.registered', CommandHandlerRegisteredEvent);
EventTypeRegistry.register('command.handler.unregistered', CommandHandlerUnregisteredEvent);
EventTypeRegistry.register('middleware.executed', MiddlewareExecutedEvent);
EventTypeRegistry.register('interceptor.executed', InterceptorExecutedEvent);
EventTypeRegistry.register('domain.event.published', DomainEventPublishedEvent);
EventTypeRegistry.register('command.bus.stats', CommandBusStatsEvent);
EventTypeRegistry.register('performance.metrics', PerformanceMetricsEvent);
EventTypeRegistry.register('security.event', SecurityEvent);
//# sourceMappingURL=event-types.js.map