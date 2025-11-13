"use strict";
/**
 * Tests for MCP Tool types and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const tool_1 = require("./tool");
const validator_1 = require("../validation/validator");
(0, vitest_1.describe)('Tool Types', () => {
    (0, vitest_1.describe)('Enumerations', () => {
        (0, vitest_1.it)('should define tool types', () => {
            (0, vitest_1.expect)(tool_1.ToolType.FUNCTION).toBe('function');
            (0, vitest_1.expect)(tool_1.ToolType.SCRIPT).toBe('script');
            (0, vitest_1.expect)(tool_1.ToolType.API_CALL).toBe('api_call');
            (0, vitest_1.expect)(tool_1.ToolType.DATABASE_QUERY).toBe('database_query');
            (0, vitest_1.expect)(tool_1.ToolType.FILE_OPERATION).toBe('file_operation');
            (0, vitest_1.expect)(tool_1.ToolType.CUSTOM).toBe('custom');
        });
        (0, vitest_1.it)('should define execution statuses', () => {
            (0, vitest_1.expect)(tool_1.ToolExecutionStatus.PENDING).toBe('pending');
            (0, vitest_1.expect)(tool_1.ToolExecutionStatus.RUNNING).toBe('running');
            (0, vitest_1.expect)(tool_1.ToolExecutionStatus.COMPLETED).toBe('completed');
            (0, vitest_1.expect)(tool_1.ToolExecutionStatus.FAILED).toBe('failed');
            (0, vitest_1.expect)(tool_1.ToolExecutionStatus.CANCELLED).toBe('cancelled');
            (0, vitest_1.expect)(tool_1.ToolExecutionStatus.TIMEOUT).toBe('timeout');
        });
    });
    (0, vitest_1.describe)('Interface Validation', () => {
        (0, vitest_1.it)('should validate tool execution context', () => {
            const context = {
                executionId: 'exec-123',
                toolName: 'test-tool',
                executor: 'user-456',
                parameters: { input: 'test' },
                startTime: new Date(),
                timeout: 30000,
                metadata: {
                    priority: 'high',
                    retryCount: 0
                },
                parentExecutionId: 'parent-exec-789'
            };
            (0, vitest_1.expect)(context.executionId).toBe('exec-123');
            (0, vitest_1.expect)(context.toolName).toBe('test-tool');
            (0, vitest_1.expect)(context.executor).toBe('user-456');
            (0, vitest_1.expect)(context.parameters).toEqual({ input: 'test' });
            (0, vitest_1.expect)(context.startTime).toBeInstanceOf(Date);
            (0, vitest_1.expect)(context.timeout).toBe(30000);
            (0, vitest_1.expect)(context.metadata?.priority).toBe('high');
            (0, vitest_1.expect)(context.parentExecutionId).toBe('parent-exec-789');
        });
        (0, vitest_1.it)('should validate tool execution log', () => {
            const log = {
                id: 'log-456',
                executionId: 'exec-123',
                level: 'info',
                message: 'Tool execution started',
                timestamp: new Date(),
                data: {
                    step: 'initialization',
                    progress: 0
                }
            };
            (0, vitest_1.expect)(log.id).toBe('log-456');
            (0, vitest_1.expect)(log.executionId).toBe('exec-123');
            (0, vitest_1.expect)(log.level).toBe('info');
            (0, vitest_1.expect)(log.message).toBe('Tool execution started');
            (0, vitest_1.expect)(log.timestamp).toBeInstanceOf(Date);
            (0, vitest_1.expect)(log.data?.step).toBe('initialization');
        });
        (0, vitest_1.it)('should validate tool search criteria', () => {
            const criteria = {
                name: 'test-*',
                type: tool_1.ToolType.FUNCTION,
                description: 'testing',
                capabilities: ['validation', 'execution'],
                tags: ['utility', 'test']
            };
            (0, vitest_1.expect)(criteria.name).toBe('test-*');
            (0, vitest_1.expect)(criteria.type).toBe(tool_1.ToolType.FUNCTION);
            (0, vitest_1.expect)(criteria.description).toBe('testing');
            (0, vitest_1.expect)(criteria.capabilities).toContain('validation');
            (0, vitest_1.expect)(criteria.tags).toContain('utility');
        });
        (0, vitest_1.it)('should validate queue statistics', () => {
            const stats = {
                currentSize: 5,
                totalEnqueued: 100,
                totalDequeued: 95,
                averageWaitTime: 250.5,
                peakSize: 15,
                createdAt: new Date()
            };
            (0, vitest_1.expect)(stats.currentSize).toBe(5);
            (0, vitest_1.expect)(stats.totalEnqueued).toBe(100);
            (0, vitest_1.expect)(stats.totalDequeued).toBe(95);
            (0, vitest_1.expect)(stats.averageWaitTime).toBe(250.5);
            (0, vitest_1.expect)(stats.peakSize).toBe(15);
            (0, vitest_1.expect)(stats.createdAt).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should validate tool sandbox configuration', () => {
            const sandboxConfig = {
                enabled: true,
                type: 'docker',
                resourceLimits: {
                    cpuTime: 10000,
                    memory: 512 * 1024 * 1024,
                    fileOperations: 100,
                    networkOperations: 50
                },
                allowedPaths: ['/tmp', '/var/tmp'],
                blockedPaths: ['/etc', '/root'],
                environment: {
                    NODE_ENV: 'sandbox',
                    PATH: '/usr/local/bin:/usr/bin:/bin'
                },
                networkAccess: {
                    enabled: true,
                    allowedDomains: ['api.example.com'],
                    blockedDomains: ['malicious.com'],
                    allowedPorts: [80, 443],
                    blockedPorts: [22, 23]
                }
            };
            (0, vitest_1.expect)(sandboxConfig.enabled).toBe(true);
            (0, vitest_1.expect)(sandboxConfig.type).toBe('docker');
            (0, vitest_1.expect)(sandboxConfig.resourceLimits.memory).toBe(512 * 1024 * 1024);
            (0, vitest_1.expect)(sandboxConfig.allowedPaths).toContain('/tmp');
            (0, vitest_1.expect)(sandboxConfig.blockedPaths).toContain('/etc');
            (0, vitest_1.expect)(sandboxConfig.environment?.NODE_ENV).toBe('sandbox');
            (0, vitest_1.expect)(sandboxConfig.networkAccess?.enabled).toBe(true);
            (0, vitest_1.expect)(sandboxConfig.networkAccess?.allowedDomains).toContain('api.example.com');
        });
        (0, vitest_1.it)('should validate network access configuration', () => {
            const networkConfig = {
                enabled: true,
                allowedDomains: ['trusted.com', '*.api.example.com'],
                blockedDomains: ['malware.com', 'phishing.net'],
                allowedPorts: [80, 443, 8080],
                blockedPorts: [22, 23, 3389]
            };
            (0, vitest_1.expect)(networkConfig.enabled).toBe(true);
            (0, vitest_1.expect)(networkConfig.allowedDomains).toContain('trusted.com');
            (0, vitest_1.expect)(networkConfig.allowedDomains).toContain('*.api.example.com');
            (0, vitest_1.expect)(networkConfig.blockedDomains).toContain('malware.com');
            (0, vitest_1.expect)(networkConfig.allowedPorts).toContain(443);
            (0, vitest_1.expect)(networkConfig.blockedPorts).toContain(22);
        });
    });
    (0, vitest_1.describe)('MCP Tool Validation', () => {
        (0, vitest_1.it)('should validate a complete MCP tool', () => {
            const tool = {
                name: 'calculator',
                description: 'A simple calculator tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        operation: {
                            type: 'string',
                            enum: ['add', 'subtract', 'multiply', 'divide']
                        },
                        operands: {
                            type: 'array',
                            items: { type: 'number' },
                            minItems: 2,
                            maxItems: 2
                        }
                    },
                    required: ['operation', 'operands']
                },
                outputSchema: {
                    type: 'object',
                    properties: {
                        result: { type: 'number' },
                        operation: { type: 'string'
                        },
                        config: {
                            timeout: 5000,
                            maxMemory: 1024 * 1024,
                            sandboxed: true
                        }
                    },
                    const: result = validator_1.mcpValidator.validateMCPTool(tool),
                    expect(result) { }, : .valid
                }
            };
        }).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should reject tool without required fields', () => {
        const invalidTool = {
            name: 'incomplete-tool'
            // missing description and inputSchema
        };
        const result = validator_1.mcpValidator.validateMCPTool(invalidTool);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.errors.some(error => error.includes('description'))).toBe(true);
        (0, vitest_1.expect)(result.errors.some(error => error.includes('inputSchema'))).toBe(true);
    });
    (0, vitest_1.it)('should reject tool with invalid input schema', () => {
        const invalidTool = {
            name: 'bad-schema-tool',
            description: 'Tool with bad schema',
            inputSchema: {
                // missing required 'type' field
                properties: {
                    input: { type: 'string',
                        const: result = validator_1.mcpValidator.validateMCPTool(invalidTool),
                        expect(result) { }, : .valid }
                }
            }
        };
    }).toBe(false);
    (0, vitest_1.expect)(result.errors.some(error => error.includes('type'))).toBe(true);
});
(0, vitest_1.it)('should accept tool with minimal required fields', () => {
    const minimalTool = {
        name: 'minimal-tool',
        description: 'A minimal tool',
        inputSchema: {
            type: 'object',
            const: result = validator_1.mcpValidator.validateMCPTool(minimalTool),
            expect(result) { }, : .valid
        }
    };
}).toBe(true);
(0, vitest_1.expect)(result.errors).toHaveLength(0);
;
(0, vitest_1.it)('should validate tool with complex configuration', () => {
    const tool = {
        name: 'complex-tool',
        description: 'A tool with complex configuration',
        inputSchema: {
            type: 'object',
            properties: {
                data: { type: 'string',
                    required: ['data']
                },
                outputSchema: {
                    type: 'object',
                    properties: {
                        processed: { type: 'string'
                        },
                        config: {
                            timeout: 30000,
                            maxMemory: 256 * 1024 * 1024,
                            sandboxed: true,
                            environment: {
                                TOOL_MODE: 'production',
                                LOG_LEVEL: 'info'
                            },
                            resourceLimits: {
                                cpuTime: 15000,
                                memory: 256 * 1024 * 1024,
                                fileOperations: 200,
                                networkOperations: 100
                            }
                        }
                    },
                    const: result = validator_1.mcpValidator.validateMCPTool(tool),
                    expect(result) { }, : .valid
                }
            }
        }
    };
}).toBe(true);
(0, vitest_1.expect)(result.errors).toHaveLength(0);
;
;
(0, vitest_1.describe)('Tool Interface Implementations', () => {
    (0, vitest_1.it)('should validate tool result structure', () => {
        const successResult = {
            success: true,
            result: { output: 'processed data' },
            metadata: {
                executionTime: 150,
                memoryUsage: 1024,
                toolVersion: '1.2.0',
                context: { step: 'final' },
                warnings: ['Minor issue detected']
            }
        };
        (0, vitest_1.expect)(successResult.success).toBe(true);
        (0, vitest_1.expect)(successResult.result?.output).toBe('processed data');
        (0, vitest_1.expect)(successResult.metadata?.executionTime).toBe(150);
        (0, vitest_1.expect)(successResult.metadata?.warnings).toContain('Minor issue detected');
        const errorResult = {
            success: false,
            error: 'Processing failed',
            metadata: {
                executionTime: 75,
                toolVersion: '1.2.0',
                context: { error: 'Invalid input format'
                },
                expect(errorResult) { }, : .success
            }
        };
    }).toBe(false);
    (0, vitest_1.expect)(errorResult.error).toBe('Processing failed');
    (0, vitest_1.expect)(errorResult.metadata?.context?.error).toBe('Invalid input format');
});
(0, vitest_1.it)('should validate validation result structure', () => {
    const validationResult = {
        valid: true,
        normalizedParams: {
            input: 'normalized input',
            options: { format: 'json'
            },
            expect(validationResult) { }, : .valid
        }
    };
}).toBe(true);
(0, vitest_1.expect)(validationResult.normalizedParams?.input).toBe('normalized input');
const invalidResult = {
    valid: false,
    errors: [
        'Missing required field: input',
        'Invalid format for field: options'
    ]
};
(0, vitest_1.expect)(invalidResult.valid).toBe(false);
(0, vitest_1.expect)(invalidResult.errors).toHaveLength(2);
(0, vitest_1.expect)(invalidResult.errors).toContain('Missing required field: input');
;
(0, vitest_1.it)('should validate tool usage statistics', () => {
    const usageStats = {
        totalExecutions: 1000,
        successfulExecutions: 950,
        failedExecutions: 50,
        averageExecutionTime: 125.5,
        lastExecution: new Date()
    };
    (0, vitest_1.expect)(usageStats.totalExecutions).toBe(1000);
    (0, vitest_1.expect)(usageStats.successfulExecutions).toBe(950);
    (0, vitest_1.expect)(usageStats.failedExecutions).toBe(50);
    (0, vitest_1.expect)(usageStats.averageExecutionTime).toBe(125.5);
    (0, vitest_1.expect)(usageStats.lastExecution).toBeInstanceOf(Date);
    (0, vitest_1.expect)(usageStats.successfulExecutions + usageStats.failedExecutions).toBe(usageStats.totalExecutions);
});
(0, vitest_1.it)('should validate tool permissions structure', () => {
    const permissions = {
        execute: true,
        requiredRoles: ['tool-user', 'admin'],
        acl: [
            {
                principal: 'user:alice',
                permissions: ['execute'],
                type: 'allow'
            },
            {
                principal: 'role:guest',
                permissions: ['execute'],
                type: 'deny'
            }
        ],
        rateLimit: {
            maxRequests: 100,
            windowSeconds: 3600,
            burstSize: 10
        }
    };
    (0, vitest_1.expect)(permissions.execute).toBe(true);
    (0, vitest_1.expect)(permissions.requiredRoles).toContain('tool-user');
    (0, vitest_1.expect)(permissions.acl).toHaveLength(2);
    (0, vitest_1.expect)(permissions.acl[0].type).toBe('allow');
    (0, vitest_1.expect)(permissions.acl[1].type).toBe('deny');
    (0, vitest_1.expect)(permissions.rateLimit?.maxRequests).toBe(100);
    (0, vitest_1.expect)(permissions.rateLimit?.windowSeconds).toBe(3600);
});
;
(0, vitest_1.describe)('JSON Schema Validation', () => {
    (0, vitest_1.it)('should validate JSON schema structure', () => {
        const schema = {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
                },
                age: {
                    type: 'number',
                    minimum: 0,
                    maximum: 150
                },
                email: {
                    type: 'string',
                    format: 'email'
                },
                preferences: {
                    type: 'object',
                    properties: {
                        theme: {
                            type: 'string',
                            enum: ['light', 'dark']
                        }
                    },
                    additionalProperties: false
                }
            },
            required: ['name', 'email'],
            additionalProperties: false
        };
        (0, vitest_1.expect)(schema.type).toBe('object');
        (0, vitest_1.expect)(schema.properties?.name?.type).toBe('string');
        (0, vitest_1.expect)(schema.properties?.age?.minimum).toBe(0);
        (0, vitest_1.expect)(schema.properties?.email?.format).toBe('email');
        (0, vitest_1.expect)(schema.required).toContain('name');
        (0, vitest_1.expect)(schema.required).toContain('email');
        (0, vitest_1.expect)(schema.additionalProperties).toBe(false);
    });
    (0, vitest_1.it)('should validate nested schema structures', () => {
        const nestedSchema = {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        profile: {
                            type: 'object',
                            properties: {
                                bio: { type: 'string' },
                                avatar: { type: 'string', format: 'uri'
                                },
                                tags: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    uniqueItems: true
                                }
                            }
                        },
                        expect(nestedSchema) { }, : .properties?.user?.type
                    }
                }
            }
        };
    }).toBe('object');
    (0, vitest_1.expect)(nestedSchema.properties?.user?.properties?.profile?.type).toBe('object');
    (0, vitest_1.expect)(nestedSchema.properties?.tags?.type).toBe('array');
    (0, vitest_1.expect)(nestedSchema.properties?.tags?.items?.type).toBe('string');
    (0, vitest_1.expect)(nestedSchema.properties?.tags?.uniqueItems).toBe(true);
});
;
;
//# sourceMappingURL=tool.test.js.map