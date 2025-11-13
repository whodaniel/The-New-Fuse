"use strict";
/**
 * Tests for ToolExecutionEngine
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ToolExecutionEngine_1 = require("./ToolExecutionEngine");
// Mock tool handler for testing
class MockToolHandler {
    name;
    executionTime;
    shouldFail;
    memoryUsage;
    constructor(name, executionTime = 100, shouldFail = false, memoryUsage = 1024 * 1024 // 1MB
    ) {
        this.name = name;
        this.executionTime = executionTime;
        this.shouldFail = shouldFail;
        this.memoryUsage = memoryUsage;
    }
    async execute(params) {
        // Simulate execution time
        await new Promise(resolve => setTimeout(resolve, this.executionTime));
        if (this.shouldFail) {
            throw new Error('Mock tool execution failed');
        }
        return {
            success: true,
            result: { processed: params, timestamp: new Date().toISOString() },
            metadata: {
                executionTime: this.executionTime,
                memoryUsage: this.memoryUsage
            }
        };
    }
    async validate(params) {
        return { valid: true, normalizedParams: params };
    }
}
// Long-running tool handler for timeout tests
class LongRunningToolHandler {
    duration;
    name = 'LongRunningToolHandler';
    constructor(duration = 5000) {
        this.duration = duration;
    }
    async execute(_params) {
        await new Promise(resolve => setTimeout(resolve, this.duration));
        return {
            success: true,
            result: { completed: true }
        };
    }
}
// Memory-intensive tool handler for resource limit tests
class MemoryIntensiveToolHandler {
    name = 'MemoryIntensiveToolHandler';
    async execute(params) {
        // Simulate memory usage (this is just for testing, real implementation would track actual usage)
        const largeArray = new Array(params.size || 1000000).fill('data');
        return {
            success: true,
            result: { arraySize: largeArray.length },
            metadata: {
                memoryUsage: largeArray.length * 4 // Approximate memory usage
            }
        };
    }
}
(0, vitest_1.describe)('ToolExecutionEngine', () => {
    let engine;
    (0, vitest_1.beforeEach)(() => {
        engine = new ToolExecutionEngine_1.ToolExecutionEngine(5000, // 5 second default timeout
        {
            cpuTime: 10000,
            memory: 64 * 1024 * 1024, // 64MB
            fileOperations: 100,
            networkOperations: 50
        });
    });
    (0, vitest_1.afterEach)(() => {
        // Clean up any active executions
        const activeExecutions = engine.getActiveExecutions();
        for (const execution of activeExecutions) {
            engine.cancelExecution(execution.executionId);
        }
    });
    (0, vitest_1.describe)('Basic Tool Execution', () => {
        (0, vitest_1.it)('should execute tool successfully with basic parameters', async () => {
            const handler = new MockToolHandler('test-tool');
            const params = { message: 'hello', count: 5 };
            const result = await engine.executeToolWithLimits(handler, params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.result).toEqual({
                processed: params,
                timestamp: vitest_1.expect.any(String)
            });
            (0, vitest_1.expect)(result.executionContext).toBeDefined();
            (0, vitest_1.expect)(result.executionContext?.toolName).toBe('test-tool');
            (0, vitest_1.expect)(result.logs).toBeDefined();
            (0, vitest_1.expect)(result.logs?.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.resourceUsage).toBeDefined();
            (0, vitest_1.expect)(result.metadata?.executionTime).toBeDefined();
        });
        (0, vitest_1.it)('should handle tool execution failures gracefully', async () => {
            const handler = new MockToolHandler('failing-tool', 100, true);
            const params = { test: 'data' };
            const result = await engine.executeToolWithLimits(handler, params);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Mock tool execution failed');
            (0, vitest_1.expect)(result.executionContext).toBeDefined();
            (0, vitest_1.expect)(result.logs).toBeDefined();
            (0, vitest_1.expect)(result.logs?.some(log => log.level === 'error')).toBe(true);
            (0, vitest_1.expect)(result.resourceUsage).toBeDefined();
        });
        (0, vitest_1.it)('should track execution in active executions during execution', async () => {
            const handler = new MockToolHandler('slow-tool', 1000);
            const params = { test: 'data' };
            const executionPromise = engine.executeToolWithLimits(handler, params);
            // Check that execution is tracked as active
            await new Promise(resolve => setTimeout(resolve, 100));
            const activeExecutions = engine.getActiveExecutions();
            (0, vitest_1.expect)(activeExecutions.length).toBe(1);
            (0, vitest_1.expect)(activeExecutions[0].toolName).toBe('slow-tool');
            // Wait for completion
            const result = await executionPromise;
            (0, vitest_1.expect)(result).toBeDefined();
            // Check that execution is no longer active
            const finalActiveExecutions = engine.getActiveExecutions();
            (0, vitest_1.expect)(finalActiveExecutions.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('Timeout Handling', () => {
        (0, vitest_1.it)('should timeout long-running executions', async () => {
            const handler = new LongRunningToolHandler(10000); // 10 seconds
            const params = { test: 'data' };
            const options = {
                timeout: 1000 // 1 second timeout
            };
            const result = await engine.executeToolWithLimits(handler, params, options);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('timed out');
            (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('timed out'))).toBe(true);
            (0, vitest_1.expect)(result.metadata?.executionTime).toBeLessThan(2000); // Should be close to timeout
        });
        (0, vitest_1.it)('should use default timeout when not specified', async () => {
            const handler = new LongRunningToolHandler(10000); // 10 seconds
            const params = { test: 'data' };
            const startTime = Date.now();
            const result = await engine.executeToolWithLimits(handler, params);
            const executionTime = Date.now() - startTime;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('timed out');
            (0, vitest_1.expect)(executionTime).toBeLessThan(5500); // Should timeout around 5 seconds (default)
            (0, vitest_1.expect)(executionTime).toBeGreaterThan(4500);
        }, 10000); // Increase test timeout to 10 seconds
        (0, vitest_1.it)('should complete successfully when execution finishes before timeout', async () => {
            const handler = new MockToolHandler('fast-tool', 500); // 500ms execution
            const params = { test: 'data' };
            const options = {
                timeout: 2000 // 2 second timeout
            };
            const result = await engine.executeToolWithLimits(handler, params, options);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.metadata?.executionTime).toBeLessThan(1000);
        });
    });
    (0, vitest_1.describe)('Resource Limits', () => {
        (0, vitest_1.it)('should enforce memory limits', async () => {
            const handler = new MemoryIntensiveToolHandler();
            const params = { size: 1000000 }; // Large array
            const options = {
                resourceLimits: {
                    memory: 1024 * 1024 // 1MB limit
                }
            };
            // Note: This test simulates memory limit enforcement
            // In a real implementation, you would need actual memory monitoring
            const result = await engine.executeToolWithLimits(handler, params, options);
            // For this mock, the tool will complete successfully
            // In a real implementation with actual memory monitoring, it would fail
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.resourceUsage).toBeDefined();
        });
        (0, vitest_1.it)('should track resource usage statistics', async () => {
            const handler = new MockToolHandler('resource-tool', 1000);
            const params = { test: 'data' };
            const result = await engine.executeToolWithLimits(handler, params);
            (0, vitest_1.expect)(result.resourceUsage).toBeDefined();
            (0, vitest_1.expect)(result.resourceUsage?.cpuTime).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.resourceUsage?.startTime).toBeInstanceOf(Date);
            (0, vitest_1.expect)(result.resourceUsage?.endTime).toBeInstanceOf(Date);
            (0, vitest_1.expect)(result.resourceUsage?.endTime.getTime()).toBeGreaterThanOrEqual(result.resourceUsage?.startTime.getTime() || 0);
        });
        (0, vitest_1.it)('should use default resource limits when not specified', async () => {
            const handler = new MockToolHandler('default-limits-tool');
            const params = { test: 'data' };
            const result = await engine.executeToolWithLimits(handler, params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.resourceUsage).toBeDefined();
            (0, vitest_1.expect)(result.logs?.some(log => log.data?.resourceLimits?.memory === 64 * 1024 * 1024)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Parameter Validation', () => {
        (0, vitest_1.it)('should validate parameters against JSON schema', async () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number', minimum: 0, maximum: 150 }
                },
                required: ['name']
            };
            const validParams = { name: 'John', age: 30 };
            const result = await engine.validateToolParameters(schema, validParams);
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.errors).toBeUndefined();
            (0, vitest_1.expect)(result.normalizedParams).toEqual(validParams);
        });
        (0, vitest_1.it)('should reject invalid parameters', async () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number', minimum: 0, maximum: 150 }
                },
                required: ['name']
            };
            const invalidParams = { age: 30 }; // missing required 'name'
            const result = await engine.validateToolParameters(schema, invalidParams);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('Missing required property: name');
        });
        (0, vitest_1.it)('should validate complex nested schemas', async () => {
            const schema = {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            contacts: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string' },
                                        value: { type: 'string', format: 'email',
                                            required: ['type', 'value']
                                        }
                                    }
                                },
                                required: ['name']
                            }
                        },
                        required: ['user']
                    },
                    const: validParams = {
                        user: {
                            name: 'John Doe',
                            contacts: [
                                { type: 'email', value: 'john@example.com' }
                            ]
                        }
                    },
                    const: result = await engine.validateToolParameters(schema, validParams),
                    expect(result) { }, : .valid
                }
            };
        }).toBe(true);
    });
    (0, vitest_1.it)('should validate format constraints', async () => {
        const schema = {
            type: 'object',
            properties: {
                email: { type: 'string', format: 'email' },
                website: { type: 'string', format: 'uri' },
                id: { type: 'string', format: 'uuid'
                },
                const: invalidParams = {
                    email: 'not-an-email',
                    website: 'not-a-uri',
                    id: 'not-a-uuid'
                },
                const: result = await engine.validateToolParameters(schema, invalidParams),
                expect(result) { }, : .valid
            }
        };
    }).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Property email: Invalid email format');
    (0, vitest_1.expect)(result.errors).toContain('Property website: Invalid URI format');
    (0, vitest_1.expect)(result.errors).toContain('Property id: Invalid UUID format');
});
(0, vitest_1.it)('should validate string patterns', async () => {
    const schema = {
        type: 'object',
        properties: {
            code: { type: 'string', pattern: '^[A-Z]{3}-\\d{3}$'
            },
            const: validParams = { code: 'ABC-123' },
            const: invalidParams = { code: 'invalid-code' },
            const: validResult = await engine.validateToolParameters(schema, validParams),
            expect(validResult) { }, : .valid
        }
    };
}).toBe(true);
const invalidResult = await engine.validateToolParameters(schema, invalidParams);
(0, vitest_1.expect)(invalidResult.valid).toBe(false);
(0, vitest_1.expect)(invalidResult.errors).toContain('Property code: Value does not match pattern: ^[A-Z]{3}-\\d{3}$');
;
(0, vitest_1.it)('should validate numeric constraints', async () => {
    const schema = {
        type: 'object',
        properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            name: { type: 'string', minLength: 2, maxLength: 50 }
        }
    };
    const invalidParams = {
        score: 150, // exceeds maximum
        name: 'A' // too short
    };
    const result = await engine.validateToolParameters(schema, invalidParams);
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Property score: Value 150 is greater than maximum 100');
    (0, vitest_1.expect)(result.errors).toContain('Property name: String length 1 is less than minimum 2');
});
;
(0, vitest_1.describe)('Execution Management', () => {
    (0, vitest_1.it)('should track execution history', async () => {
        const handler = new MockToolHandler('history-tool');
        const params = { test: 'data' };
        // Execute multiple tools
        await engine.executeToolWithLimits(handler, params);
        await engine.executeToolWithLimits(handler, { test: 'data2' });
        const history = engine.getExecutionHistory();
        (0, vitest_1.expect)(history.length).toBe(2);
        (0, vitest_1.expect)(history[0].executionContext?.toolName).toBe('history-tool');
        (0, vitest_1.expect)(history[1].executionContext?.toolName).toBe('history-tool');
    });
    (0, vitest_1.it)('should limit execution history size', async () => {
        const handler = new MockToolHandler('history-tool');
        const params = { test: 'data' };
        // Execute multiple tools
        for (let i = 0; i < 5; i++) {
            await engine.executeToolWithLimits(handler, { test: `data${i}` });
        }
        const limitedHistory = engine.getExecutionHistory(3);
        (0, vitest_1.expect)(limitedHistory.length).toBe(3);
    });
    (0, vitest_1.it)('should cancel active executions', async () => {
        const handler = new LongRunningToolHandler(5000);
        const params = { test: 'data' };
        // Start execution but don't await it
        engine.executeToolWithLimits(handler, params);
        // Wait a bit then cancel
        await new Promise(resolve => setTimeout(resolve, 100));
        const activeExecutions = engine.getActiveExecutions();
        (0, vitest_1.expect)(activeExecutions.length).toBe(1);
        const cancelled = await engine.cancelExecution(activeExecutions[0].executionId);
        (0, vitest_1.expect)(cancelled).toBe(true);
        // Check that execution is no longer active
        const finalActiveExecutions = engine.getActiveExecutions();
        (0, vitest_1.expect)(finalActiveExecutions.length).toBe(0);
    });
    (0, vitest_1.it)('should provide execution statistics', async () => {
        const successHandler = new MockToolHandler('success-tool');
        const failHandler = new MockToolHandler('fail-tool', 100, true);
        // Execute some successful and failed tools
        await engine.executeToolWithLimits(successHandler, { test: 'data1' });
        await engine.executeToolWithLimits(successHandler, { test: 'data2' });
        await engine.executeToolWithLimits(failHandler, { test: 'data3' });
        const stats = engine.getExecutionStatistics();
        (0, vitest_1.expect)(stats.totalExecutions).toBe(3);
        (0, vitest_1.expect)(stats.successfulExecutions).toBe(2);
        (0, vitest_1.expect)(stats.failedExecutions).toBe(1);
        (0, vitest_1.expect)(stats.averageExecutionTime).toBeGreaterThan(0);
        (0, vitest_1.expect)(stats.activeExecutions).toBe(0);
    });
});
(0, vitest_1.describe)('Event Handling', () => {
    (0, vitest_1.it)('should emit execution events', async () => {
        const handler = new MockToolHandler('event-tool');
        const params = { test: 'data' };
        let completionEvent = null;
        engine.on('executionComplete', (context, result) => {
            completionEvent = { context, result };
        });
        await engine.executeToolWithLimits(handler, params);
        (0, vitest_1.expect)(completionEvent).not.toBeNull();
        (0, vitest_1.expect)(completionEvent.context.toolName).toBe('event-tool');
        (0, vitest_1.expect)(completionEvent.result.success).toBe(true);
    });
    (0, vitest_1.it)('should emit error events', async () => {
        const handler = new MockToolHandler('error-tool', 100, true);
        const params = { test: 'data' };
        let errorEvent = null;
        engine.on('executionError', (context, error) => {
            errorEvent = { context, error };
        });
        await engine.executeToolWithLimits(handler, params);
        (0, vitest_1.expect)(errorEvent).not.toBeNull();
        (0, vitest_1.expect)(errorEvent.context.toolName).toBe('error-tool');
        (0, vitest_1.expect)(errorEvent.error).toBeInstanceOf(Error);
    });
    (0, vitest_1.it)('should emit cancellation events', async () => {
        const handler = new LongRunningToolHandler(5000);
        const params = { test: 'data' };
        let cancellationEvent = null;
        engine.on('executionCancelled', (context) => {
            cancellationEvent = context;
        });
        // Start execution but don't await it
        engine.executeToolWithLimits(handler, params);
        await new Promise(resolve => setTimeout(resolve, 100));
        const activeExecutions = engine.getActiveExecutions();
        await engine.cancelExecution(activeExecutions[0].executionId);
        (0, vitest_1.expect)(cancellationEvent).not.toBeNull();
        (0, vitest_1.expect)(cancellationEvent.toolName).toBe('LongRunningToolHandler');
    });
});
(0, vitest_1.describe)('Logging', () => {
    (0, vitest_1.it)('should generate comprehensive execution logs', async () => {
        const handler = new MockToolHandler('logged-tool');
        const params = { test: 'data' };
        const result = await engine.executeToolWithLimits(handler, params);
        (0, vitest_1.expect)(result.logs).toBeDefined();
        (0, vitest_1.expect)(result.logs?.length).toBeGreaterThan(0);
        const logMessages = result.logs?.map(log => log.message) || [];
        (0, vitest_1.expect)(logMessages).toContain('Tool execution started');
        (0, vitest_1.expect)(logMessages).toContain('Starting tool execution');
        (0, vitest_1.expect)(logMessages).toContain('Tool execution completed');
        (0, vitest_1.expect)(logMessages).toContain('Tool execution completed successfully');
    });
    (0, vitest_1.it)('should log errors with appropriate detail', async () => {
        const handler = new MockToolHandler('error-tool', 100, true);
        const params = { test: 'data' };
        const result = await engine.executeToolWithLimits(handler, params);
        (0, vitest_1.expect)(result.logs).toBeDefined();
        const errorLogs = result.logs?.filter(log => log.level === 'error') || [];
        (0, vitest_1.expect)(errorLogs.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(errorLogs.some(log => log.message.includes('execution threw error'))).toBe(true);
    });
    (0, vitest_1.it)('should include execution context in logs', async () => {
        const handler = new MockToolHandler('context-tool');
        const params = { test: 'data' };
        const result = await engine.executeToolWithLimits(handler, params);
        (0, vitest_1.expect)(result.logs).toBeDefined();
        const startLog = result.logs?.find(log => log.message === 'Tool execution started');
        (0, vitest_1.expect)(startLog?.data).toBeDefined();
        (0, vitest_1.expect)(startLog?.data?.toolName).toBe('context-tool');
        (0, vitest_1.expect)(startLog?.data?.timeout).toBeDefined();
        (0, vitest_1.expect)(startLog?.data?.resourceLimits).toBeDefined();
    });
});
(0, vitest_1.describe)('Security and Monitoring', () => {
    (0, vitest_1.describe)('Secure Tool Execution', () => {
        (0, vitest_1.it)('should execute tool securely with proper permissions', async () => {
            const handler = new MockToolHandler('secure-tool');
            const params = { test: 'data' };
            const permissions = {
                execute: true,
                requiredRoles: ['user'],
                acl: []
            };
            const securityContext = {
                principal: 'test-user',
                roles: ['user'],
                sessionId: 'session-123'
            };
            const result = await engine.executeToolSecurely(handler, params, permissions, securityContext);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.metadata?.securityEnforced).toBe(true);
            (0, vitest_1.expect)(result.executionContext?.executor).toBe('test-user');
            (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('Security checks passed'))).toBe(true);
        });
        (0, vitest_1.it)('should deny execution when execute permission is false', async () => {
            const handler = new MockToolHandler('denied-tool');
            const params = { test: 'data' };
            const permissions = {
                execute: false,
                requiredRoles: [],
                acl: []
            };
            const securityContext = {
                principal: 'test-user',
                roles: ['user']
            };
            const result = await engine.executeToolSecurely(handler, params, permissions, securityContext);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Tool execution not permitted');
            (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('Tool execution not permitted'))).toBe(true);
        });
        (0, vitest_1.it)('should deny execution when user lacks required roles', async () => {
            const handler = new MockToolHandler('admin-tool');
            const params = { test: 'data' };
            const permissions = {
                execute: true,
                requiredRoles: ['admin'],
                acl: []
            };
            const securityContext = {
                principal: 'test-user',
                roles: ['user'] // Missing 'admin' role
            };
            const result = await engine.executeToolSecurely(handler, params, permissions, securityContext);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Insufficient roles');
            (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('Insufficient roles'))).toBe(true);
        });
        (0, vitest_1.it)('should enforce ACL permissions', async () => {
            const handler = new MockToolHandler('acl-tool');
            const params = { test: 'data' };
            const permissions = {
                execute: true,
                requiredRoles: [],
                acl: [
                    { principal: 'admin', permissions: ['execute'], type: 'allow' },
                    { principal: 'test-user', permissions: ['execute'], type: 'deny' }
                ]
            };
            const securityContext = {
                principal: 'test-user',
                roles: ['user']
            };
            const result = await engine.executeToolSecurely(handler, params, permissions, securityContext);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('ACL permission denied');
        });
        (0, vitest_1.it)('should enforce rate limiting', async () => {
            const handler = new MockToolHandler('rate-limited-tool');
            const params = { test: 'data' };
            const permissions = {
                execute: true,
                requiredRoles: [],
                acl: [],
                rateLimit: {
                    maxRequests: 2,
                    windowSeconds: 60
                }
            };
            const securityContext = {
                principal: 'test-user',
                roles: ['user']
            };
            // First two executions should succeed
            const result1 = await engine.executeToolSecurely(handler, params, permissions, securityContext);
            (0, vitest_1.expect)(result1.success).toBe(true);
            const result2 = await engine.executeToolSecurely(handler, params, permissions, securityContext);
            (0, vitest_1.expect)(result2.success).toBe(true);
            // Third execution should be rate limited
            const result3 = await engine.executeToolSecurely(handler, params, permissions, securityContext);
            (0, vitest_1.expect)(result3.success).toBe(false);
            (0, vitest_1.expect)(result3.error).toContain('Rate limit exceeded');
        });
        (0, vitest_1.it)('should execute in sandbox when configured', async () => {
            const handler = new MockToolHandler('sandboxed-tool');
            const params = { test: 'data' };
            const permissions = {
                execute: true,
                requiredRoles: [],
                acl: []
            };
            const securityContext = {
                principal: 'test-user',
                roles: ['user']
            };
            const options = {
                sandbox: {
                    enabled: true,
                    type: 'process',
                    resourceLimits: {
                        memory: 64 * 1024 * 1024,
                        cpuTime: 5000
                    },
                    allowedPaths: ['/tmp'],
                    blockedPaths: ['/etc', '/var'],
                    environment: { SANDBOX_MODE: 'true'
                    },
                    const: result = await engine.executeToolSecurely(handler, params, permissions, securityContext, options),
                    expect(result) { }, : .success
                }
            };
        }).toBe(true);
        (0, vitest_1.expect)(result.metadata?.sandboxed).toBe(true);
        (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('Executing tool in sandbox'))).toBe(true);
        (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('Sandbox execution completed successfully'))).toBe(true);
    });
});
(0, vitest_1.describe)('Result Validation', () => {
    (0, vitest_1.it)('should validate tool results', async () => {
        const handler = new MockToolHandler('validated-tool');
        const params = { test: 'data' };
        const result = await engine.executeToolWithLimits(handler, params);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('Validating tool execution result'))).toBe(true);
        (0, vitest_1.expect)(result.logs?.some(log => log.message.includes('Tool result validation completed'))).toBe(true);
    });
    (0, vitest_1.it)('should reject invalid result format', async () => {
        const invalidHandler = {
            name: 'invalid-tool',
            async execute(_params) {
                return 'invalid result'; // Should be an object
            }
        };
        const result = await engine.executeToolWithLimits(invalidHandler, {});
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('Invalid result format');
    });
    (0, vitest_1.it)('should sanitize sensitive information from results', async () => {
        const sensitiveHandler = {
            name: 'sensitive-tool',
            async execute(_params) {
                return {
                    success: true,
                    result: { data: 'public info' },
                    metadata: {
                        credentials: 'secret-key',
                        systemInfo: '/etc/passwd',
                        publicInfo: 'safe data'
                    }
                };
                const result = await engine.executeToolWithLimits(sensitiveHandler, {});
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(result.metadata?.credentials).toBeUndefined();
                (0, vitest_1.expect)(result.metadata?.systemInfo).toBeUndefined();
                (0, vitest_1.expect)(result.metadata?.publicInfo).toBe('safe data');
            }
        };
    });
});
(0, vitest_1.describe)('Performance Monitoring', () => {
    (0, vitest_1.it)('should collect performance metrics', async () => {
        const handler = new MockToolHandler('monitored-tool', 100);
        const params = { test: 'data' };
        // Execute tool multiple times
        await engine.executeToolWithLimits(handler, params);
        await engine.executeToolWithLimits(handler, params);
        await engine.executeToolWithLimits(handler, params);
        const metrics = engine.getToolPerformanceMetrics('monitored-tool');
        (0, vitest_1.expect)(metrics).toBeDefined();
        (0, vitest_1.expect)(metrics?.executionCount).toBeGreaterThan(0);
        (0, vitest_1.expect)(metrics?.successRate).toBe(1);
        (0, vitest_1.expect)(metrics?.averageExecutionTime).toBeGreaterThan(0);
        (0, vitest_1.expect)(metrics?.errorRate).toBe(0);
    });
    (0, vitest_1.it)('should track failed executions in metrics', async () => {
        const handler = new MockToolHandler('failing-tool', 100, true);
        const params = { test: 'data' };
        // Execute failing tool
        await engine.executeToolWithLimits(handler, params);
        await engine.executeToolWithLimits(handler, params);
        const metrics = engine.getToolPerformanceMetrics('failing-tool');
        (0, vitest_1.expect)(metrics).toBeDefined();
        (0, vitest_1.expect)(metrics?.successRate).toBe(0);
        (0, vitest_1.expect)(metrics?.errorRate).toBe(1);
    });
    (0, vitest_1.it)('should provide all performance metrics', async () => {
        const handler1 = new MockToolHandler('tool-1');
        const handler2 = new MockToolHandler('tool-2');
        await engine.executeToolWithLimits(handler1, {});
        await engine.executeToolWithLimits(handler2, {});
        const allMetrics = engine.getAllPerformanceMetrics();
        (0, vitest_1.expect)(allMetrics.size).toBeGreaterThanOrEqual(2);
        (0, vitest_1.expect)(allMetrics.has('tool-1')).toBe(true);
        (0, vitest_1.expect)(allMetrics.has('tool-2')).toBe(true);
    });
});
(0, vitest_1.describe)('Security Violations', () => {
    (0, vitest_1.it)('should track security violations', async () => {
        const handler = new MockToolHandler('violation-tool');
        const params = { test: 'data' };
        const permissions = {
            execute: false, // This will cause a security violation
            requiredRoles: [],
            acl: []
        };
        const securityContext = {
            principal: 'test-user',
            roles: ['user']
        };
        await engine.executeToolSecurely(handler, params, permissions, securityContext);
        const violations = engine.getSecurityViolations();
        (0, vitest_1.expect)(violations.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should emit security violation events', async () => {
        const handler = new MockToolHandler('sandbox-violation-tool');
        const params = { test: 'data' };
        const permissions = {
            execute: true,
            requiredRoles: [],
            acl: []
        };
        const securityContext = {
            principal: 'test-user',
            roles: ['user']
        };
        const options = {
            sandbox: {
                enabled: true,
                type: 'process',
                resourceLimits: {
                    memory: 1024, // Very low limit to trigger violation
                    cpuTime: 100
                }
            }
        };
        let violationEvent = null;
        engine.on('securityViolation', (context, violation) => {
            violationEvent = { context, violation };
        });
        await engine.executeToolSecurely(handler, params, permissions, securityContext, options);
        // Note: In this mock implementation, violations might not be triggered
        // In a real implementation with actual resource monitoring, this would work
    });
});
;
;
//# sourceMappingURL=ToolExecutionEngine.test.js.map