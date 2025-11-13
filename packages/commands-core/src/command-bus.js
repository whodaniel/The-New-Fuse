"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceInterceptor = exports.MetricsMiddleware = exports.ValidationMiddleware = exports.LoggingMiddleware = exports.CommandBus = void 0;
exports.createCommandBus = createCommandBus;
exports.createCommandBusWithDefaults = createCommandBusWithDefaults;
const uuid_1 = require("uuid");
const registry_1 = require("./registry");
const engine_1 = require("./engine");
const errors_1 = require("./errors");
const logging_1 = require("./logging");
/**
 * Default command bus implementation
 */
class CommandBus {
    registry;
    engine;
    errorHandler;
    logger;
    config;
    constructor(config = {}) {
        this.config = {
            enableValidation: true,
            enableLogging: true,
            enableMetrics: true,
            defaultTimeout: 30000,
            maxConcurrentCommands: 100,
            enableRetries: false,
            maxRetries: 3,
            retryDelay: 1000,
            ...config
        };
        this.registry = new registry_1.CommandRegistry();
        this.engine = new engine_1.ExecutionEngine(this.registry, this.config);
        this.errorHandler = new errors_1.CommandErrorHandler();
        this.logger = (0, logging_1.createCommandLogger)('command-bus', 'CommandBus');
        this.setupEventListeners();
    }
    /**
     * Execute a command
     */
    async execute(command) {
        const context = this.createContext();
        return this.executeWithContext(command, context);
    }
    /**
     * Execute a command with custom context
     */
    async executeWithContext(command, context) {
        const logger = (0, logging_1.createCommandLogger)(context.executionId, command.type);
        try {
            logger.info('Executing command', { commandType: command.type }, context);
            const result = await this.engine.execute(command, context);
            if (result.success) {
                logger.info('Command executed successfully', {
                    commandType: command.type,
                    executionTime: result.metadata.executionTime,
                    eventCount: result.events.length
                }, context);
            }
            else {
                logger.error('Command execution failed', result.error, {
                    commandType: command.type,
                    errorCode: result.error?.code,
                    executionTime: result.metadata.executionTime
                }, context);
            }
            return result;
        }
        catch (error) {
            logger.error('Command execution threw error', error, {
                commandType: command.type
            }, context);
            // Handle the error
            const commandError = await this.errorHandler.handleError(error, context);
            return {
                success: false,
                error: commandError,
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
    }
    /**
     * Register a command handler
     */
    register(commandType, handler) {
        this.registry.register(commandType, handler);
        this.logger.info('Command handler registered', {
            commandType,
            handlerName: handler.getMetadata().name
        });
        // Emit handler registered event
        this.engine.emit('handler:registered', {
            commandType,
            handlerName: handler.getMetadata().name
        });
    }
    /**
     * Register a command handler factory
     */
    registerFactory(commandType, factory) {
        this.registry.registerFactory(commandType, factory);
        this.logger.info('Command handler factory registered', {
            commandType,
            factoryName: factory.getMetadata().name
        });
        // Emit factory registered event
        this.engine.emit('factory:registered', {
            commandType,
            factoryName: factory.getMetadata().name
        });
    }
    /**
     * Unregister a command handler
     */
    unregister(commandType) {
        const removed = this.registry.unregister(commandType);
        if (removed) {
            this.logger.info('Command handler unregistered', { commandType });
            // Emit handler unregistered event
            this.engine.emit('handler:unregistered', {
                commandType
            });
        }
    }
    /**
     * Check if a handler is registered
     */
    hasHandler(commandType) {
        return this.registry.has(commandType);
    }
    /**
     * Get a handler
     */
    getHandler(commandType) {
        return this.registry.getHandler(commandType);
    }
    /**
     * Set middleware
     */
    use(middleware) {
        this.engine.use(middleware);
        this.logger.info('Middleware added', {
            middlewareName: middleware.name,
            priority: middleware.priority
        });
        // Emit middleware added event
        this.engine.emit('middleware:added', {
            middlewareName: middleware.name,
            priority: middleware.priority || 0
        });
    }
    /**
     * Set interceptor
     */
    intercept(interceptor) {
        this.engine.intercept(interceptor);
        this.logger.info('Interceptor added', {
            interceptorName: interceptor.name
        });
        // Emit interceptor added event
        this.engine.emit('interceptor:added', {
            interceptorName: interceptor.name
        });
    }
    /**
     * Get command bus statistics
     */
    getStats() {
        const engineStats = this.engine.getStats();
        const registryStats = this.registry.getStats();
        return {
            ...engineStats,
            registeredHandlers: registryStats.totalHandlers + registryStats.totalFactories
        };
    }
    /**
     * Clear all handlers and middleware
     */
    clear() {
        this.registry.clear();
        this.engine.clear();
        this.logger.info('Command bus cleared');
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.engine.updateConfig(newConfig);
        this.logger.info('Command bus configuration updated', { newConfig });
    }
    /**
     * Get the registry
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * Get the execution engine
     */
    getEngine() {
        return this.engine;
    }
    /**
     * Get the error handler
     */
    getErrorHandler() {
        return this.errorHandler;
    }
    /**
     * Get the logger
     */
    getLogger() {
        return this.logger;
    }
    /**
     * Create execution context
     */
    createContext() {
        return {
            executionId: (0, uuid_1.v4)(),
            timestamp: new Date(),
            data: {},
            auth: {
                isAuthenticated: false,
                roles: [],
                permissions: [],
                claims: {}
            }
        };
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen to engine events
        this.engine.onEvent('command.execution.started', (event) => {
            this.logger.debug('Command execution started', event.data);
        });
        this.engine.onEvent('command.execution.completed', (event) => {
            this.logger.debug('Command execution completed', event.data);
        });
        this.engine.onEvent('command.execution.failed', (event) => {
            this.logger.error('Command execution failed', undefined, event.data);
        });
        this.engine.onEvent('command.validation.started', (event) => {
            this.logger.debug('Command validation started', event.data);
        });
        this.engine.onEvent('command.validation.completed', (event) => {
            this.logger.debug('Command validation completed', event.data);
        });
        this.engine.onEvent('middleware.executed', (event) => {
            this.logger.debug('Middleware executed', event.data);
        });
        this.engine.onEvent('interceptor.executed', (event) => {
            this.logger.debug('Interceptor executed', event.data);
        });
        this.engine.onEvent('domain.event.published', (event) => {
            this.logger.debug('Domain event published', event.data);
        });
        this.engine.onEvent('security.event', (event) => {
            this.logger.warn('Security event', event.data);
        });
    }
}
exports.CommandBus = CommandBus;
/**
 * Create a default command bus instance
 */
function createCommandBus(config) {
    return new CommandBus(config);
}
/**
 * Create a command bus with default middleware
 */
function createCommandBusWithDefaults(config) {
    const bus = new CommandBus(config);
    // Add default middleware
    bus.use(new LoggingMiddleware());
    bus.use(new ValidationMiddleware());
    bus.use(new MetricsMiddleware());
    // Add default interceptors
    bus.intercept(new SecurityInterceptor());
    bus.intercept(new PerformanceInterceptor());
    return bus;
}
/**
 * Default logging middleware
 */
class LoggingMiddleware {
    name = 'logging';
    priority = 1000; // Execute last
    async execute(command, context, next) {
        const logger = (0, logging_1.createCommandLogger)(context.executionId, command.type);
        logger.debug('Command processing started', {
            commandType: command.type,
            timestamp: context.timestamp
        });
        const startTime = Date.now();
        try {
            const result = await next();
            logger.debug('Command processing completed', {
                commandType: command.type,
                executionTime: Date.now() - startTime,
                success: result.success
            });
            return result;
        }
        catch (error) {
            logger.error('Command processing failed', error, {
                commandType: command.type,
                executionTime: Date.now() - startTime
            });
            throw error;
        }
    }
}
exports.LoggingMiddleware = LoggingMiddleware;
/**
 * Default validation middleware
 */
class ValidationMiddleware {
    name = 'validation';
    priority = 100; // Execute early
    async execute(command, context, next) {
        // Basic validation is handled by the command itself
        // This middleware can add additional cross-cutting validation
        return next();
    }
}
exports.ValidationMiddleware = ValidationMiddleware;
/**
 * Default metrics middleware
 */
class MetricsMiddleware {
    name = 'metrics';
    priority = 900; // Execute near the end
    async execute(command, context, next) {
        const startTime = Date.now();
        const result = await next();
        const executionTime = Date.now() - startTime;
        // Record metrics (in a real implementation, this would send to a metrics system)
        console.log(`Metrics: ${command.type} executed in ${executionTime}ms);

    return result;
  }
}

/**
 * Default security interceptor
 */
export class SecurityInterceptor implements ICommandInterceptor {
  public readonly name = 'security';

  public async beforeExecute(command: ICommand, context: ICommandContext): Promise<void> {
    // Basic security checks
    if (!context.auth.isAuthenticated) {
      throw new Error('User must be authenticated to execute commands');
    }
  }

  public async afterExecute(
    command: ICommand,
    context: ICommandContext,
    result: ICommandResult
  ): Promise<void> {
    // Post-execution security checks
    if (result.success && result.data) {
      // Log successful operations for audit`, console.log(Security, $, { context, : .userId } ` executed ${command.type}`, successfully));
    }
}
exports.MetricsMiddleware = MetricsMiddleware;
async;
onError(command, interfaces_1.ICommand, context, interfaces_1.ICommandContext, error, Error);
Promise < void  > {
    // Log security-related errors
    console, : .error(Security, $, { context, : .userId }, failed, to, execute, $, { command, : .type }, $, { error, : .message })
};
/**
 * Default performance interceptor
 */
class PerformanceInterceptor {
    name = 'performance';
    async beforeExecute(command, context) {
        // Record start time
        context.data.performanceStartTime = Date.now();
    }
    async afterExecute(command, context, result) {
        const startTime = context.data.performanceStartTime;
        if (startTime) {
            const executionTime = Date.now() - startTime;
            // Log performance warnings
            if (executionTime > 5000) { // 5 seconds`
                console.warn(Performance, $, { command, : .type }, took, $, { executionTime } `ms to execute`);
            }
        }
    }
}
exports.PerformanceInterceptor = PerformanceInterceptor;
//# sourceMappingURL=command-bus.js.map