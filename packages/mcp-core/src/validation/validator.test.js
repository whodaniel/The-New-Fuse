"use strict";
/**
 * Tests for MCP Protocol Validator
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validator_1 = require("./validator");
(0, vitest_1.describe)('MCPValidator', () => {
    let validator;
    (0, vitest_1.beforeEach)(() => {
        validator = new validator_1.MCPValidator();
    });
    (0, vitest_1.describe)('JSON-RPC Request Validation', () => {
        (0, vitest_1.it)('should validate a valid JSON-RPC request', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test.method',
                params: { key: 'value',
                    const: result = validator.validateJSONRPCRequest(request),
                    expect(result) { }, : .valid }
            };
        }).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
        (0, vitest_1.expect)(result.data).toEqual(request);
    });
    (0, vitest_1.it)('should reject request without jsonrpc version', () => {
        const request = {
            id: 1,
            method: 'test.method'
        };
        const result = validator.validateJSONRPCRequest(request);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain("root: must have required property 'jsonrpc'");
    });
    (0, vitest_1.it)('should reject request with wrong jsonrpc version', () => {
        const request = {
            jsonrpc: '1.0',
            id: 1,
            method: 'test.method'
        };
        const result = validator.validateJSONRPCRequest(request);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors.some(error => error.includes('must be equal to constant'))).toBe(true);
    });
    (0, vitest_1.it)('should reject request without method', () => {
        const request = {
            jsonrpc: '2.0',
            id: 1
        };
        const result = validator.validateJSONRPCRequest(request);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain("root: must have required property 'method'");
    });
    (0, vitest_1.it)('should accept request without params', () => {
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'test.method'
        };
        const result = validator.validateJSONRPCRequest(request);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
});
(0, vitest_1.describe)('JSON-RPC Response Validation', () => {
    (0, vitest_1.it)('should validate a valid success response', () => {
        const response = {
            jsonrpc: '2.0',
            id: 1,
            result: { success: true }
        };
        const result = validator.validateJSONRPCResponse(response);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should validate a valid error response', () => {
        const response = {
            jsonrpc: '2.0',
            id: 1,
            error: {
                code: -32600,
                message: 'Invalid Request',
                const: result = validator.validateJSONRPCResponse(response),
                expect(result) { }, : .valid
            }
        };
    }).toBe(true);
    (0, vitest_1.expect)(result.errors).toHaveLength(0);
});
(0, vitest_1.it)('should reject response with both result and error', () => {
    const response = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true },
        error: {
            code: -32600,
            message: 'Invalid Request',
            const: result = validator.validateJSONRPCResponse(response),
            expect(result) { }, : .valid
        }
    };
}).toBe(false);
;
(0, vitest_1.it)('should reject response without result or error', () => {
    const response = {
        jsonrpc: '2.0',
        id: 1
    };
    const result = validator.validateJSONRPCResponse(response);
    (0, vitest_1.expect)(result.valid).toBe(false);
});
;
(0, vitest_1.describe)('JSON-RPC Notification Validation', () => {
    (0, vitest_1.it)('should validate a valid notification', () => {
        const notification = {
            jsonrpc: '2.0',
            method: 'test.notification',
            params: { message: 'hello',
                const: result = validator.validateJSONRPCNotification(notification),
                expect(result) { }, : .valid }
        };
    }).toBe(true);
    (0, vitest_1.expect)(result.errors).toHaveLength(0);
});
(0, vitest_1.it)('should reject notification with id', () => {
    const notification = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.notification'
    };
    const result = validator.validateJSONRPCNotification(notification);
    (0, vitest_1.expect)(result.valid).toBe(false);
});
(0, vitest_1.it)('should accept notification without params', () => {
    const notification = {
        jsonrpc: '2.0',
        method: 'test.notification'
    };
    const result = validator.validateJSONRPCNotification(notification);
    (0, vitest_1.expect)(result.valid).toBe(true);
});
;
(0, vitest_1.describe)('MCP Resource Validation', () => {
    (0, vitest_1.it)('should validate a valid MCP resource', () => {
        const resource = {
            uri: 'file:///test.txt',
            name: 'Test Resource',
            description: 'A test resource',
            mimeType: 'text/plain',
            permissions: {
                read: true,
                write: false
            }
        };
        const result = validator.validateMCPResource(resource);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should reject resource without uri', () => {
        const resource = {
            name: 'Test Resource'
        };
        const result = validator.validateMCPResource(resource);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain("root: must have required property 'uri'");
    });
    (0, vitest_1.it)('should reject resource without name', () => {
        const resource = {
            uri: 'file:///test.txt'
        };
        const result = validator.validateMCPResource(resource);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain("root: must have required property 'name'");
    });
});
(0, vitest_1.describe)('MCP Tool Validation', () => {
    (0, vitest_1.it)('should validate a valid MCP tool', () => {
        const tool = {
            name: 'test-tool',
            description: 'A test tool',
            inputSchema: {
                type: 'object',
                properties: {
                    input: { type: 'string',
                        required: ['input']
                    }
                },
                const: result = validator.validateMCPTool(tool),
                expect(result) { }, : .valid
            }
        };
    }).toBe(true);
    (0, vitest_1.expect)(result.errors).toHaveLength(0);
});
(0, vitest_1.it)('should reject tool without name', () => {
    const tool = {
        description: 'A test tool',
        inputSchema: {
            type: 'object',
            const: result = validator.validateMCPTool(tool),
            expect(result) { }, : .valid
        }
    };
}).toBe(false);
(0, vitest_1.expect)(result.errors).toContain("root: must have required property 'name'");
;
(0, vitest_1.it)('should reject tool without inputSchema', () => {
    const tool = {
        name: 'test-tool',
        description: 'A test tool'
    };
    const result = validator.validateMCPTool(tool);
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain("root: must have required property 'inputSchema'");
});
;
(0, vitest_1.describe)('Custom Schema Management', () => {
    (0, vitest_1.it)('should add and use custom schema', () => {
        const customSchema = {
            type: 'object',
            properties: {
                customField: { type: 'string',
                    required: ['customField']
                },
                validator, : .addSchema('custom', customSchema),
                expect(validator) { }, : .hasSchema('custom')
            }
        };
    }).toBe(true);
    const validData = { customField: 'test' };
    const result = validator.validate('custom', validData);
    (0, vitest_1.expect)(result.valid).toBe(true);
    const invalidData = { wrongField: 'test' };
    const invalidResult = validator.validate('custom', invalidData);
    (0, vitest_1.expect)(invalidResult.valid).toBe(false);
});
(0, vitest_1.it)('should remove custom schema', () => {
    const customSchema = {
        type: 'object',
        properties: {
            customField: { type: 'string'
            },
            validator, : .addSchema('custom', customSchema),
            expect(validator) { }, : .hasSchema('custom')
        }
    };
}).toBe(true);
const removed = validator.removeSchema('custom');
(0, vitest_1.expect)(removed).toBe(true);
(0, vitest_1.expect)(validator.hasSchema('custom')).toBe(false);
;
(0, vitest_1.it)('should list schema names', () => {
    const schemaNames = validator.getSchemaNames();
    (0, vitest_1.expect)(schemaNames).toContain('jsonrpcRequest');
    (0, vitest_1.expect)(schemaNames).toContain('mcpResource');
    (0, vitest_1.expect)(schemaNames).toContain('mcpTool');
});
;
(0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle unknown schema gracefully', () => {
        const result = validator.validate('unknown-schema', {});
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain('Unknown schema: unknown-schema');
    });
    (0, vitest_1.it)('should throw error when using validateOrThrow with invalid data', () => {
        const invalidRequest = {
            jsonrpc: '1.0', // Wrong version
            id: 1,
            method: 'test'
        };
        (0, vitest_1.expect)(() => {
            validator.validateOrThrow('jsonrpcRequest', invalidRequest);
        }).toThrow();
    });
    (0, vitest_1.it)('should return data when using validateOrThrow with valid data', () => {
        const validRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'test'
        };
        const result = validator.validateOrThrow('jsonrpcRequest', validRequest);
        (0, vitest_1.expect)(result).toEqual(validRequest);
    });
});
;
(0, vitest_1.describe)('Global Validator Instance', () => {
    (0, vitest_1.it)('should provide a global validator instance', () => {
        (0, vitest_1.expect)(validator_1.mcpValidator).toBeInstanceOf(validator_1.MCPValidator);
    });
    (0, vitest_1.it)('should validate using global instance', () => {
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'test.method'
        };
        const result = validator_1.mcpValidator.validateJSONRPCRequest(request);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
});
//# sourceMappingURL=validator.test.js.map