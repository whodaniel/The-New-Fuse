"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const command_bus_1 = require("../command-bus");
const fixtures_spec_1 = require("./fixtures.spec");
(0, globals_1.describe)('Command Architecture Performance Tests', () => {
    let commandBus;
    let mockContext;
    (0, globals_1.beforeEach)(() => {
        commandBus = new command_bus_1.CommandBus({
            enableMetrics: true,
            maxConcurrentCommands: 100
        });
        mockContext = (0, fixtures_spec_1.createMockCommandContext)();
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(() => {
        commandBus.clear();
    });
    (0, globals_1.describe)('Execution Performance', () => {
        (0, globals_1.it)('should execute commands within acceptable time limits', async () => {
            commandBus.register('PerfTestCommand', {
                handle: async (command) => ({
                    success: true,
                    data: { processed: true },
                    metadata: {
                        executionTime: 5,
                        completedAt: new Date(),
                        eventCount: 0
                    },
                    events: []
                }),
                canHandle: (command) => command.type === 'PerfTestCommand',
                getMetadata: () => ({
                    name: 'PerfTestHandler',
                    commandTypes: ['PerfTestCommand'],
                    version: '1.0.0'
                })
            });
            const startTime = performance.now();
            for (let i = 0; i < 100; i++) {
                const command = new fixtures_spec_1.TestCommand(`perf-${i});
        (command as any).type = 'PerfTestCommand';
        await commandBus.execute(command);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 100;

      // Should be fast (less than 10ms per command on average)
      expect(averageTime).toBeLessThan(10);
      expect(totalTime).toBeLessThan(2000); // Less than 2 seconds total
    });

    it('should handle async operations efficiently', async () => {
      commandBus.register('AsyncPerfCommand', {
        handle: async (command: any) => {
          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, command.data.delay));
          return {
            success: true,
            data: { asyncProcessed: true, delay: command.data.delay },
            metadata: {
              executionTime: command.data.delay,
              completedAt: new Date(),
              eventCount: 0
            },
            events: []
          };
        },
        canHandle: (command: any) => command.type === 'AsyncPerfCommand',
        getMetadata: () => ({
          name: 'AsyncPerfHandler',
          commandTypes: ['AsyncPerfCommand'],
          version: '1.0.0'
        })
      });

      const delays = [10, 20, 30, 40, 50];
      const startTime = performance.now();

      const promises = delays.map(delay => {
        const command = new AsyncTestCommand(delay);
        (command as any).type = 'AsyncPerfCommand';
        return commandBus.execute(command);
      });

      const results = await Promise.all(promises);
      const endTime = performance.now();

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.asyncProcessed).toBe(true);
      });

      // Should complete in approximately the time of the longest operation
      // (since they run concurrently), plus some overhead
      const totalTime = endTime - startTime;
      expect(totalTime).toBeGreaterThan(45); // At least the longest delay
      expect(totalTime).toBeLessThan(150); // But not too much more
    });

    it('should maintain performance under memory pressure', async () => {
      // Create commands that allocate memory
      class MemoryIntensiveCommand extends TestCommand {
        constructor(size: number) {`, super(`memory-${size}`));
                this.memorySize = size;
            }
        }, private, memorySize, number);
    }, commandBus.register('MemoryCommand', {
        handle: async (command) => {
            // Allocate some memory
            const data = new Array(command.memorySize).fill('x');
            await new Promise(resolve => setTimeout(resolve, 1));
            return {
                success: true,
                data: { allocated: data.length },
                metadata: {
                    executionTime: 1,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        },
        canHandle: (command) => command.type === 'MemoryCommand',
        getMetadata: () => ({
            name: 'MemoryHandler',
            commandTypes: ['MemoryCommand'],
            version: '1.0.0'
        })
    }));
    const startTime = performance.now();
    const startMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    // Execute memory-intensive commands
    for (let i = 0; i < 50; i++) {
        const command = new MemoryIntensiveCommand(1000);
        command.type = 'MemoryCommand';
        await commandBus.execute(command);
    }
    const endTime = performance.now();
    const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const totalTime = endTime - startTime;
    const memoryDelta = endMemory - startMemory;
    // Performance should still be acceptable
    (0, globals_1.expect)(totalTime).toBeLessThan(1000); // Less than 1 second
    // Memory usage should not be excessive (allowing for GC variations)
    if (process.memoryUsage) {
        (0, globals_1.expect)(memoryDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    }
});
;
(0, globals_1.describe)('Concurrent Execution Load Testing', () => {
    (0, globals_1.it)('should handle high concurrency without degradation', async () => {
        commandBus.register('ConcurrentLoadCommand', {
            handle: async (command) => {
                // Small random delay to simulate real work
                const delay = Math.random() * 5 + 1;
                await new Promise(resolve => setTimeout(resolve, delay));
                return {
                    success: true,
                    data: { loadTested: true, id: command.data.id },
                    metadata: {
                        executionTime: delay,
                        completedAt: new Date(),
                        eventCount: 0
                    },
                    events: []
                };
            },
            canHandle: (command) => command.type === 'ConcurrentLoadCommand',
            getMetadata: () => ({
                name: 'ConcurrentLoadHandler',
                commandTypes: ['ConcurrentLoadCommand'],
                version: '1.0.0'
            })
        });
        const concurrencyLevels = [10, 25, 50, 100];
        const results = [];
        for (const concurrency of concurrencyLevels) {
            const startTime = performance.now();
            const promises = Array.from({ length: concurrency }, (_, i) => {
                const command = new fixtures_spec_1.TestCommand(load - $, { i });
                command.type = 'ConcurrentLoadCommand';
                command.data.id = i;
                return commandBus.execute(command);
            });
            const commandResults = await Promise.all(promises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const averageTime = totalTime / concurrency;
            results.push({ concurrency, totalTime, averageTime });
            // All should succeed
            commandResults.forEach(result => {
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(result.data.loadTested).toBe(true);
            });
        }
        // Performance should scale reasonably
        // Higher concurrency should not cause exponential time increases
        for (let i = 1; i < results.length; i++) {
            const scalingFactor = results[i].concurrency / results[i - 1].concurrency;
            const timeFactor = results[i].averageTime / results[i - 1].averageTime;
            // Time should not scale worse than linearly (allowing some overhead)
            (0, globals_1.expect)(timeFactor).toBeLessThan(scalingFactor * 2);
        }
    });
    (0, globals_1.it)('should handle command queueing under load', async () => {
        const processedOrder = [];
        let activeCommands = 0;
        let maxConcurrent = 0;
        commandBus.updateConfig({ maxConcurrentCommands: 5 });
        commandBus.register('QueueTestCommand', {
            handle: async (command) => {
                activeCommands++;
                maxConcurrent = Math.max(maxConcurrent, activeCommands);
                // Simulate work
                await new Promise(resolve => setTimeout(resolve, 10));
                processedOrder.push(command.data.id);
                activeCommands--;
                return {
                    success: true,
                    data: { queued: true, id: command.data.id },
                    metadata: {
                        executionTime: 10,
                        completedAt: new Date(),
                        eventCount: 0
                    },
                    events: []
                };
            },
            canHandle: (command) => command.type === 'QueueTestCommand',
            getMetadata: () => ({
                name: 'QueueTestHandler',
                commandTypes: ['QueueTestCommand'],
                version: '1.0.0'
            })
        });
        const startTime = performance.now();
        // Execute more commands than max concurrent limit
        const promises = Array.from({ length: 20 }, (_, i) => {
            `
        const command = new TestCommand(queue-${i}`;
        });
        command.type = 'QueueTestCommand';
        command.data.id = i;
        return commandBus.execute(command);
    });
    const results = await Promise.all(promises);
    const endTime = performance.now();
    // All should succeed
    results.forEach(result => {
        (0, globals_1.expect)(result.success).toBe(true);
        (0, globals_1.expect)(result.data.queued).toBe(true);
    });
    // Should not exceed max concurrent limit
    (0, globals_1.expect)(maxConcurrent).toBeLessThanOrEqual(5);
    // All commands should be processed
    (0, globals_1.expect)(processedOrder).toHaveLength(20);
    (0, globals_1.expect)(processedOrder.sort((a, b) => a - b)).toEqual(processedOrder); // Should be in order
    // Total time should reflect queuing
    const totalTime = endTime - startTime;
    (0, globals_1.expect)(totalTime).toBeGreaterThan(200); // At least 4 batches of 5 commands * 10ms each
    (0, globals_1.expect)(totalTime).toBeLessThan(1000); // But not too long
});
;
(0, globals_1.describe)('Memory Leak Prevention', () => {
    (0, globals_1.it)('should not leak memory during repeated executions', async () => {
        commandBus.register('LeakTestCommand', {
            handle: async (command) => ({
                success: true,
                data: { leakTested: true, iteration: command.data.iteration },
                metadata: {
                    executionTime: 1,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            }),
            canHandle: (command) => command.type === 'LeakTestCommand',
            getMetadata: () => ({
                name: 'LeakTestHandler',
                commandTypes: ['LeakTestCommand'],
                version: '1.0.0'
            })
        });
        const iterations = 1000;
        const memoryChecks = 10;
        const memorySnapshots = [];
        for (let i = 0; i < iterations; i++) {
            const command = new fixtures_spec_1.TestCommand(leak - $, { i });
            command.type = 'LeakTestCommand';
            command.data.iteration = i;
            await commandBus.execute(command);
            // Take memory snapshots at regular intervals
            if (i % (iterations / memoryChecks) === 0) {
                if (process.memoryUsage) {
                    memorySnapshots.push(process.memoryUsage().heapUsed);
                }
            }
        }
        if (memorySnapshots.length > 1) {
            const initialMemory = memorySnapshots[0];
            const finalMemory = memorySnapshots[memorySnapshots.length - 1];
            const memoryGrowth = finalMemory - initialMemory;
            // Memory growth should be minimal (allowing for normal GC variations)
            const maxAcceptableGrowth = 10 * 1024 * 1024; // 10MB
            (0, globals_1.expect)(memoryGrowth).toBeLessThan(maxAcceptableGrowth);
            // Memory should not grow significantly per iteration
            const growthPerIteration = memoryGrowth / iterations;
            (0, globals_1.expect)(growthPerIteration).toBeLessThan(1024); // Less than 1KB per iteration
        }
    });
    (0, globals_1.it)('should clean up event listeners and resources', async () => {
        let eventListenerCount = 0;
        commandBus.register('CleanupTestCommand', {
            handle: async (command) => {
                // Simulate adding event listeners
                eventListenerCount++;
                const cleanup = () => {
                    eventListenerCount--;
                };
                // Store cleanup function (simulating real resource management)
                commandBus.cleanupFunctions = commandBus.cleanupFunctions || [];
                commandBus.cleanupFunctions.push(cleanup);
                await new Promise(resolve => setTimeout(resolve, 1));
                return {
                    success: true,
                    data: { cleaned: true },
                    metadata: {
                        executionTime: 1,
                        completedAt: new Date(),
                        eventCount: 0
                    },
                    events: []
                };
            },
            canHandle: (command) => command.type === 'CleanupTestCommand',
            getMetadata: () => ({
                name: 'CleanupTestHandler',
                commandTypes: ['CleanupTestCommand'],
                version: '1.0.0'
            })
        });
        `
      // Execute commands that create resources`;
        for (let i = 0; i < 50; i++) {
            const command = new fixtures_spec_1.TestCommand(cleanup - $, { i } `);
        (command as any).type = 'CleanupTestCommand';
        await commandBus.execute(command);
      }

      // Simulate cleanup
      if ((commandBus as any).cleanupFunctions) {
        (commandBus as any).cleanupFunctions.forEach((cleanup: () => void) => cleanup());
        (commandBus as any).cleanupFunctions = [];
      }

      // Event listeners should be cleaned up
      expect(eventListenerCount).toBe(0);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover quickly from errors', async () => {
      let errorCount = 0;
      let successCount = 0;

      commandBus.register('ErrorRecoveryCommand', {
        handle: async (command: any) => {
          if (command.data.shouldFail) {
            errorCount++;
            throw new Error('Simulated error');
          } else {
            successCount++;
            return {
              success: true,
              data: { recovered: true },
              metadata: {
                executionTime: 2,
                completedAt: new Date(),
                eventCount: 0
              },
              events: []
            };
          }
        },
        canHandle: (command: any) => command.type === 'ErrorRecoveryCommand',
        getMetadata: () => ({
          name: 'ErrorRecoveryHandler',
          commandTypes: ['ErrorRecoveryCommand'],
          version: '1.0.0'
        })
      });

      const startTime = performance.now();

      // Mix of failing and succeeding commands
      const commands = Array.from({ length: 100 }, (_, i) => ({
        shouldFail: i % 10 === 0, // Every 10th command fails
        id: i
      }));

      for (const cmdData of commands) {
        const command = new TestCommand(recovery-${cmdData.id});
        (command as any).type = 'ErrorRecoveryCommand';
        (command as any).data.shouldFail = cmdData.shouldFail;

        try {
          await commandBus.execute(command);
        } catch (error) {
          // Expected for failing commands
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should have expected error/success counts
      expect(errorCount).toBe(10);
      expect(successCount).toBe(90);

      // Performance should still be good despite errors
      expect(totalTime).toBeLessThan(1000); // Less than 1 second

      // Average time per command should be reasonable
      const averageTime = totalTime / 100;
      expect(averageTime).toBeLessThan(10);
    });

    it('should handle timeout scenarios efficiently', async () => {
      commandBus.updateConfig({ defaultTimeout: 100 });

      commandBus.register('TimeoutTestCommand', {
        handle: async (command: any) => {
          if (command.data.shouldTimeout) {
            // Delay longer than timeout
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          return {
            success: true,
            data: { timeout: command.data.shouldTimeout },
            metadata: {
              executionTime: command.data.shouldTimeout ? 200 : 5,
              completedAt: new Date(),
              eventCount: 0
            },
            events: []
          };
        },
        canHandle: (command: any) => command.type === 'TimeoutTestCommand',
        getMetadata: () => ({
          name: 'TimeoutTestHandler',
          commandTypes: ['TimeoutTestCommand'],
          version: '1.0.0'
        })
      });

      const startTime = performance.now();

      // Mix of normal and timeout commands
      const results = await Promise.allSettled([
        ...Array.from({ length: 8 }, () => {
          const command = new TestCommand('normal');
          (command as any).type = 'TimeoutTestCommand';
          (command as any).data.shouldTimeout = false;
          return commandBus.execute(command);
        }),
        ...Array.from({ length: 2 }, () => {
          const command = new TestCommand('timeout');
          (command as any).type = 'TimeoutTestCommand';
          (command as any).data.shouldTimeout = true;
          return commandBus.execute(command);
        })
      ]);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Most should succeed
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      expect(fulfilled.length).toBeGreaterThanOrEqual(8);
      expect(rejected.length).toBeLessThanOrEqual(2);

      // Should complete reasonably quickly (timeouts should not hang)
      expect(totalTime).toBeLessThan(500); // Less than 500ms
    });
  });

  describe('Resource Usage Monitoring', () => {
    it('should monitor and report resource usage', async () => {
      const resourceMetrics: Array<{ memory: number; cpu: number; time: number }> = [];

      commandBus.register('ResourceMonitorCommand', {
        handle: async (command: any) => {
          const startMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
          const startTime = performance.now();

          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 5));

          const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
          const endTime = performance.now();

          resourceMetrics.push({
            memory: endMemory - startMemory,
            cpu: 0, // Would need more complex monitoring
            time: endTime - startTime
          });

          return {
            success: true,
            data: { monitored: true },
            metadata: {
              executionTime: endTime - startTime,
              completedAt: new Date(),
              eventCount: 0
            },
            events: []
          };
        },
        canHandle: (command: any) => command.type === 'ResourceMonitorCommand',
        getMetadata: () => ({
          name: 'ResourceMonitorHandler',
          commandTypes: ['ResourceMonitorCommand'],
          version: '1.0.0'
        })
      });
`);
            // Execute multiple commands to gather metrics`
            for (let i = 0; i < 20; i++) {
                const command = new fixtures_spec_1.TestCommand(monitor - $, { i } `);
        (command as any).type = 'ResourceMonitorCommand';
        await commandBus.execute(command);
      }

      // Analyze metrics
      const averageTime = resourceMetrics.reduce((sum, m) => sum + m.time, 0) / resourceMetrics.length;
      const maxMemory = Math.max(...resourceMetrics.map(m => m.memory));
      const totalMemory = resourceMetrics.reduce((sum, m) => sum + m.memory, 0);

      // Performance expectations
      expect(averageTime).toBeGreaterThan(4); // At least the delay
      expect(averageTime).toBeLessThan(20); // Not too slow

      if (process.memoryUsage) {
        expect(maxMemory).toBeLessThan(1024 * 1024); // Less than 1MB per command
        expect(totalMemory).toBeGreaterThan(-1024 * 1024); // Not negative (GC can cause this)
      }

      // Check command bus stats
      const stats = commandBus.getStats();
      expect(stats.totalExecuted).toBe(20);
      expect(stats.successful).toBe(20);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });

    it('should detect performance degradation', async () => {
      const executionTimes: number[] = [];

      commandBus.register('DegradationTestCommand', {
        handle: async (command: any) => {
          const startTime = performance.now();

          // Simulate increasing work load
          const workUnits = command.data.iteration + 1;
          for (let i = 0; i < workUnits; i++) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }

          const executionTime = performance.now() - startTime;
          executionTimes.push(executionTime);

          return {
            success: true,
            data: { degraded: true, iteration: command.data.iteration },
            metadata: {
              executionTime,
              completedAt: new Date(),
              eventCount: 0
            },
            events: []
          };
        },
        canHandle: (command: any) => command.type === 'DegradationTestCommand',
        getMetadata: () => ({
          name: 'DegradationTestHandler',
          commandTypes: ['DegradationTestCommand'],
          version: '1.0.0'
        })
      });

      // Execute commands with increasing workload
      for (let i = 0; i < 10; i++) {
        const command = new TestCommand(degradation-${i}`);
                command.type = 'DegradationTestCommand';
                command.data.iteration = i;
                await commandBus.execute(command);
            }
            // Execution times should increase (showing the workload increase)
            for (let i = 1; i < executionTimes.length; i++) {
                (0, globals_1.expect)(executionTimes[i]).toBeGreaterThan(executionTimes[i - 1]);
            }
            // But the increase should be linear, not exponential
            const firstTime = executionTimes[0];
            const lastTime = executionTimes[executionTimes.length - 1];
            const ratio = lastTime / firstTime;
            // Should be roughly linear with the workload (which increases linearly)
            (0, globals_1.expect)(ratio).toBeLessThan(15); // Allow some variance
            (0, globals_1.expect)(ratio).toBeGreaterThan(5); // But should show increase
        }
    });
});
;
//# sourceMappingURL=performance.spec.js.map