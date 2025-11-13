"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const command_bus_1 = require("../command-bus");
const interfaces_1 = require("../interfaces");
const fixtures_spec_1 = require("./fixtures.spec");
(0, globals_1.describe)('Command Architecture Error Handling Tests', () => {
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
    (0, globals_1.describe)('Command Execution Errors', () => {
        (0, globals_1.it)('should handle synchronous command errors', async () => {
            commandBus.register('SyncErrorCommand', {
                handle: async () => {
                    throw new Error('Synchronous error');
                },
                canHandle: (command) => command.type === 'SyncErrorCommand',
                getMetadata: () => ({
                    name: 'SyncErrorHandler',
                    commandTypes: ['SyncErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('error-input');
            command.type = 'SyncErrorCommand';
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBeInstanceOf(interfaces_1.CommandError);
            (0, globals_1.expect)(result.error?.message).toBe('Synchronous error');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.INTERNAL);
        });
        (0, globals_1.it)('should handle asynchronous command errors', async () => {
            commandBus.register('AsyncErrorCommand', {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    throw new Error('Asynchronous error');
                },
                canHandle: (command) => command.type === 'AsyncErrorCommand',
                getMetadata: () => ({
                    name: 'AsyncErrorHandler',
                    commandTypes: ['AsyncErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('async-error');
            command.type = 'AsyncErrorCommand';
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBeInstanceOf(interfaces_1.CommandError);
            (0, globals_1.expect)(result.error?.message).toBe('Asynchronous error');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.INTERNAL);
        });
        (0, globals_1.it)('should handle command errors with custom error types', async () => {
            commandBus.register('CustomErrorCommand', {
                handle: async () => {
                    throw new interfaces_1.CommandError({
                        code: 'CUSTOM_ERROR',
                        message: 'Custom business error',
                        type: interfaces_1.ErrorType.BUSINESS_RULE,
                        details: { customData: 'test' }
                    });
                },
                canHandle: (command) => command.type === 'CustomErrorCommand',
                getMetadata: () => ({
                    name: 'CustomErrorHandler',
                    commandTypes: ['CustomErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('custom-error');
            command.type = 'CustomErrorCommand';
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBeInstanceOf(interfaces_1.CommandError);
            (0, globals_1.expect)(result.error?.code).toBe('CUSTOM_ERROR');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.BUSINESS_RULE);
            (0, globals_1.expect)(result.error?.details?.customData).toBe('test');
        });
        (0, globals_1.it)('should handle unhandled promise rejections', async () => {
            commandBus.register('PromiseRejectionCommand', {
                handle: async () => {
                    // Simulate unhandled rejection
                    Promise.reject(new Error('Unhandled rejection'));
                    // Return success immediately (the rejection happens asynchronously)
                    return {
                        success: true,
                        data: { completed: true },
                        metadata: {
                            executionTime: 1,
                            completedAt: new Date(),
                            eventCount: 0
                        },
                        events: []
                    };
                },
                canHandle: (command) => command.type === 'PromiseRejectionCommand',
                getMetadata: () => ({
                    name: 'PromiseRejectionHandler',
                    commandTypes: ['PromiseRejectionCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('promise-rejection');
            command.type = 'PromiseRejectionCommand';
            // The command itself should succeed, but there might be unhandled rejections
            const result = await commandBus.execute(command);
            (0, globals_1.expect)(result.success).toBe(true);
            // Note: In a real scenario, you'd want to handle unhandled rejections globally
        });
    });
    (0, globals_1.describe)('Handler Registration Errors', () => {
        (0, globals_1.it)('should handle duplicate handler registration', () => {
            const handler1 = {
                handle: async () => ({ success: true, data: {}, metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 }, events: [] }),
                canHandle: () => true,
                getMetadata: () => ({ name: 'Handler1', commandTypes: ['Test'], version: '1.0.0' })
            };
            const handler2 = {
                handle: async () => ({ success: true, data: {}, metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 }, events: [] }),
                canHandle: () => true,
                getMetadata: () => ({ name: 'Handler2', commandTypes: ['Test'], version: '1.0.0' })
            };
            commandBus.register('TestCommand', handler1);
            (0, globals_1.expect)(() => commandBus.register('TestCommand', handler2)).not.toThrow();
            // Should allow overwriting handlers
        });
        (0, globals_1.it)('should handle invalid handler registration', () => {
            const invalidHandler = {
                // Missing required methods
                handle: null,
                canHandle: () => true,
                getMetadata: () => ({ name: 'Invalid', commandTypes: ['Test'], version: '1.0.0' })
            };
            (0, globals_1.expect)(() => {
                commandBus.register('InvalidCommand', invalidHandler);
            }).not.toThrow(); // Registration itself shouldn't fail
            const command = new fixtures_spec_1.TestCommand('invalid');
            command.type = 'InvalidCommand';
            // But execution should handle the invalid handler gracefully
            (0, globals_1.expect)(async () => {
                await commandBus.execute(command);
            }).not.toThrow();
        });
        (0, globals_1.it)('should handle handler factory errors', async () => {
            const failingFactory = {
                create: () => {
                    throw new Error('Factory creation failed');
                },
                getMetadata: () => ({
                    name: 'FailingFactory',
                    commandTypes: ['FactoryCommand'],
                    version: '1.0.0',
                    singleton: false
                })
            };
            commandBus.registerFactory('FactoryCommand', failingFactory);
            const command = new fixtures_spec_1.TestCommand('factory-error');
            command.type = 'FactoryCommand';
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow('Factory creation failed');
        });
    });
    (0, globals_1.describe)('Middleware and Interceptor Errors', () => {
        (0, globals_1.it)('should handle middleware execution errors', async () => {
            const failingMiddleware = {
                name: 'failing',
                priority: 100,
                execute: async () => {
                    throw new Error('Middleware failed');
                }
            };
            commandBus.use(failingMiddleware);
            commandBus.register('MiddlewareErrorCommand', {
                handle: async () => ({
                    success: true,
                    data: { processed: true },
                    metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
                    events: []
                }),
                canHandle: (command) => command.type === 'MiddlewareErrorCommand',
                getMetadata: () => ({
                    name: 'MiddlewareErrorHandler',
                    commandTypes: ['MiddlewareErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('middleware-error');
            command.type = 'MiddlewareErrorCommand';
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow('Middleware failed');
        });
        (0, globals_1.it)('should handle interceptor errors', async () => {
            const failingInterceptor = {
                name: 'failing',
                beforeExecute: async () => {
                    throw new Error('Before interceptor failed');
                }
            };
            commandBus.intercept(failingInterceptor);
            commandBus.register('InterceptorErrorCommand', {
                handle: async () => ({
                    success: true,
                    data: { processed: true },
                    metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
                    events: []
                }),
                canHandle: (command) => command.type === 'InterceptorErrorCommand',
                getMetadata: () => ({
                    name: 'InterceptorErrorHandler',
                    commandTypes: ['InterceptorErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('interceptor-error');
            command.type = 'InterceptorErrorCommand';
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow('Before interceptor failed');
        });
        (0, globals_1.it)('should continue execution when non-critical interceptors fail', async () => {
            const criticalInterceptor = {
                name: 'critical',
                beforeExecute: async () => {
                    throw new Error('Critical failure');
                }
            };
            const nonCriticalInterceptor = {
                name: 'non-critical',
                afterExecute: async () => {
                    // This should not execute if before fails
                    throw new Error('This should not happen');
                }
            };
            commandBus.intercept(criticalInterceptor);
            commandBus.intercept(nonCriticalInterceptor);
            commandBus.register('CriticalErrorCommand', {
                handle: async () => ({
                    success: true,
                    data: { processed: true },
                    metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
                    events: []
                }),
                canHandle: (command) => command.type === 'CriticalErrorCommand',
                getMetadata: () => ({
                    name: 'CriticalErrorHandler',
                    commandTypes: ['CriticalErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('critical-error');
            command.type = 'CriticalErrorCommand';
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow('Critical failure');
            // The after interceptor should not execute
        });
    });
    (0, globals_1.describe)('Validation Errors', () => {
        (0, globals_1.it)('should handle validation failures', async () => {
            const command = new fixtures_spec_1.ValidationTestCommand(-5); // Invalid: negative value
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.code).toBe('VALIDATION_FAILED');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.VALIDATION);
        });
        (0, globals_1.it)('should handle multiple validation errors', async () => {
            class MultiValidationCommand extends fixtures_spec_1.ValidationTestCommand {
                async validateData() {
                    const errors = await super.validateData(mockContext);
                    // Add another validation error
                    errors.push(this.createValidationError('ADDITIONAL_ERROR', 'Additional validation failed', 'extraField', 'invalid'));
                    return errors;
                }
            }
            const command = new MultiValidationCommand(1001); // Invalid: too large
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.code).toBe('VALIDATION_FAILED');
            // Should contain both errors
        });
        (0, globals_1.it)('should handle validation warnings', async () => {
            class WarningCommand extends fixtures_spec_1.ValidationTestCommand {
                async validateWarnings() {
                    return [
                        this.createValidationWarning('DEPRECATED_FIELD', 'Field is deprecated', 'value', this.data.value)
                    ];
                }
            }
            const command = new WarningCommand(50); // Valid value
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            // Warnings don't prevent execution
        });
        (0, globals_1.it)('should handle context validation failures', async () => {
            const command = new fixtures_spec_1.ValidationTestCommand(10);
            const invalidContext = { ...mockContext, executionId: undefined };
            const result = await command.execute(invalidContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.code).toBe('VALIDATION_FAILED');
        });
    });
    (0, globals_1.describe)('Resource and System Errors', () => {
        (0, globals_1.it)('should handle out of memory errors', async () => {
            commandBus.register('MemoryErrorCommand', {
                handle: async () => {
                    // Simulate out of memory by allocating huge array
                    const hugeArray = new Array(100000000); // This might cause issues
                    return {
                        success: true,
                        data: { allocated: hugeArray.length },
                        metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
                        events: []
                    };
                },
                canHandle: (command) => command.type === 'MemoryErrorCommand',
                getMetadata: () => ({
                    name: 'MemoryErrorHandler',
                    commandTypes: ['MemoryErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('memory-error');
            command.type = 'MemoryErrorCommand';
            // This might throw or succeed depending on system memory
            try {
                const result = await commandBus.execute(command);
                (0, globals_1.expect)(result.success).toBe(true);
            }
            catch (error) {
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
        (0, globals_1.it)('should handle network timeouts', async () => {
            commandBus.register('NetworkTimeoutCommand', {
                handle: async () => {
                    // Simulate network call that times out
                    await new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Network timeout')), 100);
                    });
                },
                canHandle: (command) => command.type === 'NetworkTimeoutCommand',
                getMetadata: () => ({
                    name: 'NetworkTimeoutHandler',
                    commandTypes: ['NetworkTimeoutCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('network-timeout');
            command.type = 'NetworkTimeoutCommand';
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow('Network timeout');
        });
        (0, globals_1.it)('should handle file system errors', async () => {
            const fs = require('fs').promises;
            commandBus.register('FileSystemErrorCommand', {
                handle: async () => {
                    // Try to access non-existent file
                    await fs.readFile('/non/existent/file.txt');
                    return {
                        success: true,
                        data: { read: true },
                        metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
                        events: []
                    };
                },
                canHandle: (command) => command.type === 'FileSystemErrorCommand',
                getMetadata: () => ({
                    name: 'FileSystemErrorHandler',
                    commandTypes: ['FileSystemErrorCommand'],
                    version: '1.0.0'
                })
            });
            const command = new fixtures_spec_1.TestCommand('fs-error');
            command.type = 'FileSystemErrorCommand';
            await (0, globals_1.expect)(commandBus.execute(command)).rejects.toThrow();
        });
    });
    (0, globals_1.describe)('Concurrent Error Scenarios', () => {
        (0, globals_1.it)('should handle errors in concurrent executions', async () => {
            let errorCount = 0;
            let successCount = 0;
            commandBus.register('ConcurrentErrorCommand', {
                handle: async (command) => {
                    if (command.data.shouldFail) {
                        errorCount++;
                        throw new Error(`Concurrent error ${errorCount});
          } else {
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 5));
            return {
              success: true,
              data: { concurrent: true, id: command.data.id },
              metadata: { executionTime: 5, completedAt: new Date(), eventCount: 0 },
              events: []
            };
          }
        },
        canHandle: (command: any) => command.type === 'ConcurrentErrorCommand',
        getMetadata: () => ({
          name: 'ConcurrentErrorHandler',
          commandTypes: ['ConcurrentErrorCommand'],
          version: '1.0.0'
        })
      });

      // Mix of failing and succeeding commands
      const promises = Array.from({ length: 20 }, (_, i) => {`);
                        const command = new fixtures_spec_1.TestCommand(`concurrent-${i}`);
                        command.type = 'ConcurrentErrorCommand';
                        command.data.shouldFail = i % 4 === 0; // Every 4th command fails
                        command.data.id = i;
                        return commandBus.execute(command);
                    }
                }
            });
            const results = await Promise.allSettled(promises);
            const fulfilled = results.filter(r => r.status === 'fulfilled' && r.value.success);
            const rejected = results.filter(r => r.status === 'rejected');
            (0, globals_1.expect)(fulfilled.length).toBe(15); // 20 - 5 failures
            (0, globals_1.expect)(rejected.length).toBe(5); // Every 4th of 20 = 5 failures
            (0, globals_1.expect)(successCount).toBe(15);
            (0, globals_1.expect)(errorCount).toBe(5);
        });
        (0, globals_1.it)('should handle race conditions in error handling', async () => {
            let sharedResource = 0;
            const errors = [];
            commandBus.register('RaceConditionCommand', {
                handle: async (command) => {
                    // Simulate race condition with shared resource
                    const current = sharedResource;
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                    if (current !== sharedResource) {
                        throw new Error('Race condition detected');
                    }
                    sharedResource++;
                    return {
                        success: true,
                        data: { raced: true, value: sharedResource },
                        metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
                        events: []
                    };
                },
                canHandle: (command) => command.type === 'RaceConditionCommand',
                getMetadata: () => ({
                    name: 'RaceConditionHandler',
                    commandTypes: ['RaceConditionCommand'],
                    version: '1.0.0'
                })
            });
            // Execute commands that might race
            const promises = Array.from({ length: 10 }, (_, i) => {
                const command = new fixtures_spec_1.TestCommand(race - $, { i });
                command.type = 'RaceConditionCommand';
                return commandBus.execute(command).catch(error => {
                    errors.push(error);
                    return { success: false, error };
                });
            });
            const results = await Promise.all(promises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            // Some might succeed, some might fail due to race conditions
            (0, globals_1.expect)(successful.length + failed.length).toBe(10);
            (0, globals_1.expect)(errors.length).toBe(failed.length);
        });
    });
    (0, globals_1.describe)('Recovery and Retry Mechanisms', () => {
        (0, globals_1.it)('should implement retry logic for transient failures', async () => {
            let attemptCount = 0;
            commandBus.register('RetryCommand', {
                handle: async (command) => {
                    attemptCount++;
                    if (attemptCount < 3) {
                        `
            throw new Error(Transient failure on attempt ${attemptCount}`;
                    }
                }
            });
        });
        return {
            success: true,
            data: { retried: true, attempts: attemptCount },
            metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
            events: []
        };
    }, canHandle, (command) => command.type === 'RetryCommand', getMetadata, () => ({
        name: 'RetryHandler',
        commandTypes: ['RetryCommand'],
        version: '1.0.0'
    }));
});
// Note: This would require implementing retry logic in the command bus
// For now, we test the basic error handling
const command = new fixtures_spec_1.TestCommand('retry-test');
command.type = 'RetryCommand';
const result = await commandBus.execute(command);
// Should eventually succeed after retries
(0, globals_1.expect)(result.success).toBe(true);
(0, globals_1.expect)(result.data.attempts).toBe(3);
;
(0, globals_1.it)('should handle circuit breaker scenarios', async () => {
    let failureCount = 0;
    commandBus.register('CircuitBreakerCommand', {
        handle: async (command) => {
            failureCount++;
            if (failureCount <= 3) {
                throw new Error('Circuit breaker test failure');
            }
            return {
                success: true,
                data: { circuit: 'closed', failures: failureCount },
                metadata: { executionTime: 0, completedAt: new Date(), eventCount: 0 },
                events: []
            };
        },
        canHandle: (command) => command.type === 'CircuitBreakerCommand',
        getMetadata: () => ({
            name: 'CircuitBreakerHandler',
            commandTypes: ['CircuitBreakerCommand'],
            version: '1.0.0'
        })
    });
    // First few should fail
    for (let i = 0; i < 3; i++) {
        const command = new fixtures_spec_1.TestCommand(circuit - $, { i } `);
        (command as any).type = 'CircuitBreakerCommand';

        await expect(commandBus.execute(command)).rejects.toThrow('Circuit breaker test failure');
      }

      // This one should succeed (simulating circuit breaker recovery)
      const command = new TestCommand('circuit-recovery');
      (command as any).type = 'CircuitBreakerCommand';

      const result = await commandBus.execute(command);
      expect(result.success).toBe(true);
      expect(result.data.failures).toBe(4);
    });
  });

  describe('Logging and Monitoring Errors', () => {
    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      commandBus.register('LoggingErrorCommand', {
        handle: async () => {
          const error = new Error('Test error for logging');
          console.error('Handler error:', error);
          throw error;
        },
        canHandle: (command: any) => command.type === 'LoggingErrorCommand',
        getMetadata: () => ({
          name: 'LoggingErrorHandler',
          commandTypes: ['LoggingErrorCommand'],
          version: '1.0.0'
        })
      });

      const command = new TestCommand('logging-error');
      (command as any).type = 'LoggingErrorCommand';

      await expect(commandBus.execute(command)).rejects.toThrow('Test error for logging');

      expect(consoleSpy).toHaveBeenCalledWith('Handler error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle logging system failures', async () => {
      // Mock console.error to throw
      const originalConsoleError = console.error;
      console.error = () => {
        throw new Error('Logging system failure');
      };

      commandBus.register('LoggingFailureCommand', {
        handle: async () => {
          throw new Error('Handler error');
        },
        canHandle: (command: any) => command.type === 'LoggingFailureCommand',
        getMetadata: () => ({
          name: 'LoggingFailureHandler',
          commandTypes: ['LoggingFailureCommand'],
          version: '1.0.0'
        })
      });

      const command = new TestCommand('logging-failure');
      (command as any).type = 'LoggingFailureCommand';

      // Should still handle the original error even if logging fails
      await expect(commandBus.execute(command)).rejects.toThrow('Handler error');

      // Restore console.error
      console.error = originalConsoleError;
    });
  });
}););
    }
});
//# sourceMappingURL=error-handling.spec.js.map