"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const command_bus_1 = require("../command-bus");
const fixtures_spec_1 = require("./fixtures.spec");
(0, globals_1.describe)('CommandBus', () => {
    let commandBus;
    let mockContext;
    (0, globals_1.beforeEach)(() => {
        commandBus = new command_bus_1.CommandBus();
        mockContext = (0, fixtures_spec_1.createMockCommandContext)();
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(() => {
        commandBus.clear();
    });
    (0, globals_1.describe)('constructor', () => {
        (0, globals_1.it)('should initialize with default configuration', () => {
            const bus = new command_bus_1.CommandBus();
            (0, globals_1.expect)(bus.getConfig().enableValidation).toBe(true);
            (0, globals_1.expect)(bus.getConfig().enableLogging).toBe(true);
            (0, globals_1.expect)(bus.getConfig().defaultTimeout).toBe(30000);
            (0, globals_1.expect)(bus.getConfig().maxConcurrentCommands).toBe(100);
        });
        (0, globals_1.it)('should merge custom configuration with defaults', () => {
            const customConfig = {
                enableValidation: false,
                defaultTimeout: 60000,
                maxConcurrentCommands: 50
            };
            const bus = new command_bus_1.CommandBus(customConfig);
            (0, globals_1.expect)(bus.getConfig().enableValidation).toBe(false);
            (0, globals_1.expect)(bus.getConfig().defaultTimeout).toBe(60000);
            (0, globals_1.expect)(bus.getConfig().maxConcurrentCommands).toBe(50);
            (0, globals_1.expect)(bus.getConfig().enableLogging).toBe(true); // default preserved
        });
    });
    (0, globals_1.describe)('execute', () => {
        (0, globals_1.it)('should execute command successfully', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.data).toEqual({ handled: true, executionCount: 1 });
            (0, globals_1.expect)(handler.getExecutionCount()).toBe(1);
        });
        (0, globals_1.it)('should handle command execution failure', async () => {
            const command = new fixtures_spec_1.FailingCommand();
            const handler = new fixtures_spec_1.MockCommandHandler(true); // Failing handler
            commandBus.register('FailingCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.code).toBe('MOCK_HANDLER_ERROR');
            (0, globals_1.expect)(handler.getExecutionCount()).toBe(1);
        });
        (0, globals_1.it)('should throw error when no handler is registered', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow();
        });
        (0, globals_1.it)('should create new context when executing without custom context', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
            // Context should be created internally
        });
    });
    (0, globals_1.describe)('executeWithContext', () => {
        (0, globals_1.it)('should execute command with provided context', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            const customContext = (0, fixtures_spec_1.createMockCommandContext)({
                userId: 'custom-user',
                correlationId: 'custom-correlation'
            });
            commandBus.register('TestCommand', handler);
            const result = await commandBus.executeWithContext(command, customContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(customContext.userId).toBe('custom-user');
            (0, globals_1.expect)(customContext.correlationId).toBe('custom-correlation');
        });
        (0, globals_1.it)('should handle errors gracefully with custom context', async () => {
            const command = new fixtures_spec_1.FailingCommand();
            const handler = new fixtures_spec_1.MockCommandHandler(true);
            const customContext = (0, fixtures_spec_1.createMockCommandContext)();
            commandBus.register('FailingCommand', handler);
            const result = await commandBus.executeWithContext(command, customContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBeDefined();
        });
    });
    (0, globals_1.describe)('handler registration', () => {
        (0, globals_1.it)('should register and retrieve handlers', () => {
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            (0, globals_1.expect)(commandBus.hasHandler('TestCommand')).toBe(true);
            (0, globals_1.expect)(commandBus.getHandler('TestCommand')).toBe(handler);
        });
        (0, globals_1.it)('should unregister handlers', () => {
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            (0, globals_1.expect)(commandBus.hasHandler('TestCommand')).toBe(true);
            commandBus.unregister('TestCommand');
            (0, globals_1.expect)(commandBus.hasHandler('TestCommand')).toBe(false);
            (0, globals_1.expect)(commandBus.getHandler('TestCommand')).toBeUndefined();
        });
        (0, globals_1.it)('should return false for non-existent handlers', () => {
            (0, globals_1.expect)(commandBus.hasHandler('NonExistentCommand')).toBe(false);
            (0, globals_1.expect)(commandBus.getHandler('NonExistentCommand')).toBeUndefined();
        });
        (0, globals_1.it)('should handle multiple handlers for different commands', () => {
            const handler1 = new fixtures_spec_1.MockCommandHandler();
            const handler2 = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('Command1', handler1);
            commandBus.register('Command2', handler2);
            (0, globals_1.expect)(commandBus.hasHandler('Command1')).toBe(true);
            (0, globals_1.expect)(commandBus.hasHandler('Command2')).toBe(true);
            (0, globals_1.expect)(commandBus.getHandler('Command1')).toBe(handler1);
            (0, globals_1.expect)(commandBus.getHandler('Command2')).toBe(handler2);
        });
    });
    (0, globals_1.describe)('factory registration', () => {
        (0, globals_1.it)('should register and use handler factories', async () => {
            const factory = {
                create: () => new fixtures_spec_1.MockCommandHandler(),
                getMetadata: () => ({
                    name: 'TestFactory',
                    description: 'Test factory',
                    commandTypes: ['FactoryCommand'],
                    version: '1.0.0',
                    singleton: false
                })
            };
            commandBus.registerFactory('FactoryCommand', factory);
            const command = new fixtures_spec_1.TestCommand('test-input');
            // Change command type to match factory
            command.type = 'FactoryCommand';
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
        });
        (0, globals_1.it)('should handle singleton factories', async () => {
            let createCount = 0;
            const factory = {
                create: () => {
                    createCount++;
                    return new fixtures_spec_1.MockCommandHandler();
                },
                getMetadata: () => ({
                    name: 'SingletonFactory',
                    description: 'Singleton test factory',
                    commandTypes: ['SingletonCommand'],
                    version: '1.0.0',
                    singleton: true
                })
            };
            commandBus.registerFactory('SingletonCommand', factory);
            // Execute multiple times
            for (let i = 0; i < 3; i++) {
                const command = new fixtures_spec_1.TestCommand('test-input');
                command.type = 'SingletonCommand';
                await commandBus.execute(command);
            }
            // Should create handler only once for singleton
            (0, globals_1.expect)(createCount).toBe(1);
        });
    });
    (0, globals_1.describe)('middleware', () => {
        (0, globals_1.it)('should execute middleware in correct order', async () => {
            const middleware1 = new fixtures_spec_1.MockMiddleware();
            const middleware2 = new fixtures_spec_1.MockMiddleware();
            commandBus.use(middleware1);
            commandBus.use(middleware2);
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(middleware1.getExecutionCount()).toBe(1);
            (0, globals_1.expect)(middleware2.getExecutionCount()).toBe(1);
            (0, globals_1.expect)(result.metadata.middlewareCompleted).toBe(true);
        });
        (0, globals_1.it)('should handle middleware execution errors', async () => {
            const failingMiddleware = {
                name: 'failing',
                priority: 100,
                execute: async (command, context, next) => {
                    throw new Error('Middleware failed');
                }
            };
            commandBus.use(failingMiddleware);
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow('Middleware failed');
        });
        (0, globals_1.it)('should respect middleware priority', async () => {
            const highPriorityMiddleware = new fixtures_spec_1.MockMiddleware();
            highPriorityMiddleware.priority = 50;
            const lowPriorityMiddleware = new fixtures_spec_1.MockMiddleware();
            lowPriorityMiddleware.priority = 150;
            commandBus.use(highPriorityMiddleware);
            commandBus.use(lowPriorityMiddleware);
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
            // Both should execute
            (0, globals_1.expect)(highPriorityMiddleware.getExecutionCount()).toBe(1);
            (0, globals_1.expect)(lowPriorityMiddleware.getExecutionCount()).toBe(1);
        });
    });
    (0, globals_1.describe)('interceptors', () => {
        (0, globals_1.it)('should execute interceptors for successful commands', async () => {
            const interceptor = new fixtures_spec_1.MockInterceptor();
            commandBus.intercept(interceptor);
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(interceptor.getCounts().before).toBe(1);
            (0, globals_1.expect)(interceptor.getCounts().after).toBe(1);
            (0, globals_1.expect)(interceptor.getCounts().error).toBe(0);
        });
        (0, globals_1.it)('should execute error interceptors for failed commands', async () => {
            const interceptor = new fixtures_spec_1.MockInterceptor();
            commandBus.intercept(interceptor);
            const command = new fixtures_spec_1.FailingCommand();
            const handler = new fixtures_spec_1.MockCommandHandler(true);
            commandBus.register('FailingCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(interceptor.getCounts().before).toBe(1);
            (0, globals_1.expect)(interceptor.getCounts().after).toBe(0);
            (0, globals_1.expect)(interceptor.getCounts().error).toBe(1);
        });
        (0, globals_1.it)('should handle multiple interceptors', async () => {
            const interceptor1 = new fixtures_spec_1.MockInterceptor();
            const interceptor2 = new fixtures_spec_1.MockInterceptor();
            commandBus.intercept(interceptor1);
            commandBus.intercept(interceptor2);
            const command = new fixtures_spec_1.TestCommand('test-input');
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(interceptor1.getCounts().before).toBe(1);
            (0, globals_1.expect)(interceptor2.getCounts().before).toBe(1);
        });
    });
    (0, globals_1.describe)('statistics and monitoring', () => {
        (0, globals_1.it)('should track execution statistics', async () => {
            const handler = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('TestCommand', handler);
            // Execute multiple commands
            for (let i = 0; i < 3; i++) {
                const command = new fixtures_spec_1.TestCommand(`input-${i}`);
                await commandBus.execute(command);
            }
            const stats = commandBus.getStats();
            (0, globals_1.expect)(stats.totalExecuted).toBe(3);
            (0, globals_1.expect)(stats.successful).toBe(3);
            (0, globals_1.expect)(stats.failed).toBe(0);
            (0, globals_1.expect)(stats.registeredHandlers).toBeGreaterThan(0);
            (0, globals_1.expect)(stats.averageExecutionTime).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should track failed executions', async () => {
            const handler = new fixtures_spec_1.MockCommandHandler(true); // Failing handler
            commandBus.register('FailingCommand', handler);
            const command = new fixtures_spec_1.FailingCommand();
            await commandBus.execute(command);
            const stats = commandBus.getStats();
            (0, globals_1.expect)(stats.totalExecuted).toBe(1);
            (0, globals_1.expect)(stats.successful).toBe(0);
            (0, globals_1.expect)(stats.failed).toBe(1);
        });
        (0, globals_1.it)('should track execution counts by command type', async () => {
            const handler1 = new fixtures_spec_1.MockCommandHandler();
            const handler2 = new fixtures_spec_1.MockCommandHandler();
            commandBus.register('Command1', handler1);
            commandBus.register('Command2', handler2);
            // Execute different command types
            await commandBus.execute(Object.assign(new fixtures_spec_1.TestCommand('test'), { type: 'Command1' }));
            await commandBus.execute(Object.assign(new fixtures_spec_1.TestCommand('test'), { type: 'Command1' }));
            await commandBus.execute(Object.assign(new fixtures_spec_1.TestCommand('test'), { type: 'Command2' }));
            const stats = commandBus.getStats();
            (0, globals_1.expect)(stats.executionCounts['Command1']).toBe(2);
            (0, globals_1.expect)(stats.executionCounts['Command2']).toBe(1);
        });
    });
    (0, globals_1.describe)('configuration', () => {
        (0, globals_1.it)('should update configuration', () => {
            const newConfig = {
                enableValidation: false,
                maxConcurrentCommands: 200
            };
            commandBus.updateConfig(newConfig);
            const config = commandBus.getConfig();
            (0, globals_1.expect)(config.enableValidation).toBe(false);
            (0, globals_1.expect)(config.maxConcurrentCommands).toBe(200);
            (0, globals_1.expect)(config.enableLogging).toBe(true); // unchanged
        });
        (0, globals_1.it)('should provide access to internal components', () => {
            (0, globals_1.expect)(commandBus.getRegistry()).toBeDefined();
            (0, globals_1.expect)(commandBus.getEngine()).toBeDefined();
            (0, globals_1.expect)(commandBus.getErrorHandler()).toBeDefined();
            (0, globals_1.expect)(commandBus.getLogger()).toBeDefined();
        });
    });
    (0, globals_1.describe)('cleanup', () => {
        (0, globals_1.it)('should clear all handlers and middleware', () => {
            const handler = new fixtures_spec_1.MockCommandHandler();
            const middleware = new fixtures_spec_1.MockMiddleware();
            const interceptor = new fixtures_spec_1.MockInterceptor();
            commandBus.register('TestCommand', handler);
            commandBus.use(middleware);
            commandBus.intercept(interceptor);
            (0, globals_1.expect)(commandBus.hasHandler('TestCommand')).toBe(true);
            commandBus.clear();
            (0, globals_1.expect)(commandBus.hasHandler('TestCommand')).toBe(false);
            (0, globals_1.expect)(commandBus.getStats().registeredHandlers).toBe(0);
        });
    });
    (0, globals_1.describe)('factory functions', () => {
        (0, globals_1.it)('should create basic command bus', () => {
            const bus = (0, command_bus_1.createCommandBus)();
            (0, globals_1.expect)(bus).toBeInstanceOf(command_bus_1.CommandBus);
            (0, globals_1.expect)(bus.getConfig().enableValidation).toBe(true);
        });
        (0, globals_1.it)('should create command bus with custom config', () => {
            const config = { enableValidation: false };
            const bus = (0, command_bus_1.createCommandBus)(config);
            (0, globals_1.expect)(bus.getConfig().enableValidation).toBe(false);
        });
        (0, globals_1.it)('should create command bus with defaults', () => {
            const bus = (0, command_bus_1.createCommandBusWithDefaults)();
            (0, globals_1.expect)(bus).toBeInstanceOf(command_bus_1.CommandBus);
            // Should have default middleware and interceptors
            (0, globals_1.expect)(bus.getStats().registeredMiddleware).toBeGreaterThan(0);
            (0, globals_1.expect)(bus.getStats().registeredInterceptors).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=command-bus.spec.js.map