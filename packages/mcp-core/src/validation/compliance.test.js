"use strict";
/**
 * MCP Protocol Compliance Tests
 *
 * These tests verify that the MCP implementation complies with the
 * JSON-RPC 2.0 specification and MCP protocol requirements.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validator_1 = require("./validator");
const messageValidator_1 = require("./messageValidator");
const error_1 = require("../types/error");
(0, vitest_1.describe)('MCP Protocol Compliance', () => {
    (0, vitest_1.describe)('JSON-RPC 2.0 Compliance', () => {
        (0, vitest_1.it)('should enforce jsonrpc version 2.0', () => {
            const invalidVersions = ['1.0', '2.1', '3.0', null, undefined, 2.0];
            invalidVersions.forEach(version => {
                const request = {
                    jsonrpc: version,
                    id: 1,
                    method: 'test'
                };
                const result = validator_1.mcpValidator.validateJSONRPCRequest(request);
                (0, vitest_1.expect)(result.valid).toBe(false);
            });
        });
        (0, vitest_1.it)('should accept valid request ID types', () => {
            const validIds = ['string-id', 123, 0, -1];
            validIds.forEach(id => {
                const request = {
                    jsonrpc: '2.0',
                    id,
                    method: 'test'
                };
                const result = validator_1.mcpValidator.validateJSONRPCRequest(request);
                (0, vitest_1.expect)(result.valid).toBe(true);
            });
        });
        (0, vitest_1.it)('should accept valid response ID types including null', () => {
            const validIds = ['string-id', 123, 0, -1, null];
            validIds.forEach(id => {
                const response = {
                    jsonrpc: '2.0',
                    id,
                    result: 'success'
                };
                const result = validator_1.mcpValidator.validateJSONRPCResponse(response);
                (0, vitest_1.expect)(result.valid).toBe(true);
            });
        });
        (0, vitest_1.it)('should reject notifications with id field', () => {
            const notification = {
                jsonrpc: '2.0',
                id: 1, // Notifications must not have id
                method: 'test.notification'
            };
            const result = validator_1.mcpValidator.validateJSONRPCNotification(notification);
            (0, vitest_1.expect)(result.valid).toBe(false);
        });
        (0, vitest_1.it)('should enforce error object structure', () => {
            const validError = {
                jsonrpc: '2.0',
                id: 1,
                error: {
                    code: -32600,
                    message: 'Invalid Request',
                    const: result = validator_1.mcpValidator.validateJSONRPCResponse(validError),
                    expect(result) { }, : .valid
                }
            };
        }).toBe(true);
    });
    (0, vitest_1.it)('should reject response with both result and error', () => {
        const invalidResponse = {
            jsonrpc: '2.0',
            id: 1,
            result: 'success',
            error: {
                code: -32600,
                message: 'Invalid Request',
                const: result = validator_1.mcpValidator.validateJSONRPCResponse(invalidResponse),
                expect(result) { }, : .valid
            }
        };
    }).toBe(false);
});
(0, vitest_1.it)('should reject response with neither result nor error', () => {
    const invalidResponse = {
        jsonrpc: '2.0',
        id: 1
    };
    const result = validator_1.mcpValidator.validateJSONRPCResponse(invalidResponse);
    (0, vitest_1.expect)(result.valid).toBe(false);
});
;
(0, vitest_1.describe)('MCP Protocol Extensions', () => {
    (0, vitest_1.it)('should accept MCP request with meta field', () => {
        const mcpRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'resources/list',
            params: {},
            meta: {
                timestamp: new Date().toISOString(),
                source: 'test-client',
                priority: 'normal',
                const: result = validator_1.mcpValidator.validateMCPRequest(mcpRequest),
                expect(result) { }, : .valid
            }
        };
    }).toBe(true);
});
(0, vitest_1.it)('should accept MCP response with meta field', () => {
    const mcpResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { resources: [] },
        meta: {
            timestamp: new Date().toISOString(),
            processingTime: 150,
            serverId: 'test-server',
            const: result = validator_1.mcpValidator.validateMCPResponse(mcpResponse),
            expect(result) { }, : .valid
        }
    };
}).toBe(true);
;
(0, vitest_1.it)('should accept MCP notification with meta field', () => {
    const mcpNotification = {
        jsonrpc: '2.0',
        method: 'notifications/progress',
        params: { progress: 50 },
        meta: {
            timestamp: new Date().toISOString(),
            source: 'test-server',
            type: 'status',
            const: result = validator_1.mcpValidator.validateMCPNotification(mcpNotification),
            expect(result) { }, : .valid
        }
    };
}).toBe(true);
;
(0, vitest_1.it)('should validate priority values in meta', () => {
    const validPriorities = ['low', 'normal', 'high'];
    validPriorities.forEach(priority => {
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'test',
            meta: { priority }
        };
        const result = validator_1.mcpValidator.validateMCPRequest(request);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
});
(0, vitest_1.it)('should validate notification types in meta', () => {
    const validTypes = ['event', 'status', 'alert'];
    validTypes.forEach(type => {
        const notification = {
            jsonrpc: '2.0',
            method: 'test.notification',
            meta: { type }
        };
        const result = validator_1.mcpValidator.validateMCPNotification(notification);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
});
;
(0, vitest_1.describe)('MCP Resource Compliance', () => {
    (0, vitest_1.it)('should enforce URI format for resources', () => {
        const validResource = {
            uri: 'file:///path/to/resource.txt',
            name: 'Test Resource',
            permissions: { read: true }
        };
        const result = validator_1.mcpValidator.validateMCPResource(validResource);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
    (0, vitest_1.it)('should require read permission in resource permissions', () => {
        const resourceWithoutRead = {
            uri: 'file:///test.txt',
            name: 'Test Resource',
            permissions: { write: true } // Missing required 'read'
        };
        const result = validator_1.mcpValidator.validateMCPResource(resourceWithoutRead);
        (0, vitest_1.expect)(result.valid).toBe(false);
    });
    (0, vitest_1.it)('should accept optional resource fields', () => {
        const fullResource = {
            uri: 'file:///test.txt',
            name: 'Test Resource',
            description: 'A test resource',
            mimeType: 'text/plain',
            metadata: { size: 1024 },
            permissions: {
                read: true,
                write: false,
                subscribe: true,
                requiredRoles: ['user', 'admin']
            }
        };
        const result = validator_1.mcpValidator.validateMCPResource(fullResource);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
});
(0, vitest_1.describe)('MCP Tool Compliance', () => {
    (0, vitest_1.it)('should enforce JSON Schema for tool input', () => {
        const validTool = {
            name: 'test-tool',
            description: 'A test tool',
            inputSchema: {
                type: 'object',
                properties: {
                    input: { type: 'string',
                        required: ['input']
                    }
                },
                const: result = validator_1.mcpValidator.validateMCPTool(validTool),
                expect(result) { }, : .valid
            }
        };
    }).toBe(true);
});
(0, vitest_1.it)('should accept optional output schema', () => {
    const toolWithOutput = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: {
            type: 'object',
            properties: {
                input: { type: 'string'
                },
                outputSchema: {
                    type: 'object',
                    properties: {
                        result: { type: 'string',
                            const: result = validator_1.mcpValidator.validateMCPTool(toolWithOutput),
                            expect(result) { }, : .valid }
                    }
                }
            }
        }
    };
}).toBe(true);
;
(0, vitest_1.it)('should accept tool configuration', () => {
    const toolWithConfig = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' },
        config: {
            timeout: 5000,
            maxMemory: 1024 * 1024,
            sandboxed: true
        }
    };
    const result = validator_1.mcpValidator.validateMCPTool(toolWithConfig);
    (0, vitest_1.expect)(result.valid).toBe(true);
});
;
(0, vitest_1.describe)('MCP Capability Compliance', () => {
    (0, vitest_1.it)('should enforce semantic versioning for capabilities', () => {
        const validVersions = ['1.0.0', '2.1.3', '0.1.0-alpha', '1.0.0-beta.1'];
        validVersions.forEach(version => {
            const capability = {
                name: 'test-capability',
                version,
                description: 'A test capability',
                methods: ['test.method']
            };
            const result = validator_1.mcpValidator.validateMCPCapability(capability);
            (0, vitest_1.expect)(result.valid).toBe(true);
        });
    });
    (0, vitest_1.it)('should reject invalid version formats', () => {
        const invalidVersions = ['1.0', '1', 'v1.0.0', '1.0.0.0'];
        invalidVersions.forEach(version => {
            const capability = {
                name: 'test-capability',
                version,
                description: 'A test capability',
                methods: ['test.method']
            };
            const result = validator_1.mcpValidator.validateMCPCapability(capability);
            (0, vitest_1.expect)(result.valid).toBe(false);
        });
    });
    (0, vitest_1.it)('should require at least one method', () => {
        const capabilityWithoutMethods = {
            name: 'test-capability',
            version: '1.0.0',
            description: 'A test capability',
            methods: [] // Empty methods array
        };
        const result = validator_1.mcpValidator.validateMCPCapability(capabilityWithoutMethods);
        (0, vitest_1.expect)(result.valid).toBe(false);
    });
    (0, vitest_1.it)('should accept optional capability metadata', () => {
        const capabilityWithMetadata = {
            name: 'test-capability',
            version: '1.0.0',
            description: 'A test capability',
            methods: ['test.method'],
            notifications: ['test.notification'],
            experimental: true,
            metadata: {
                author: 'Test Author',
                documentation: 'https://example.com/docs',
                license: 'MIT',
                tags: ['test', 'example']
            }
        };
        const result = validator_1.mcpValidator.validateMCPCapability(capabilityWithMetadata);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
});
(0, vitest_1.describe)('Error Code Compliance', () => {
    (0, vitest_1.it)('should use standard JSON-RPC error codes', () => {
        const standardCodes = [
            error_1.JSONRPCErrorCode.PARSE_ERROR,
            error_1.JSONRPCErrorCode.INVALID_REQUEST,
            error_1.JSONRPCErrorCode.METHOD_NOT_FOUND,
            error_1.JSONRPCErrorCode.INVALID_PARAMS,
            error_1.JSONRPCErrorCode.INTERNAL_ERROR
        ];
        standardCodes.forEach(code => {
            (0, vitest_1.expect)(code).toBeTypeOf('number');
            (0, vitest_1.expect)(code).toBeLessThan(0);
        });
    });
    (0, vitest_1.it)('should use MCP-specific error codes in reserved range', () => {
        const mcpCodes = [
            error_1.MCPErrorCode.RESOURCE_NOT_FOUND,
            error_1.MCPErrorCode.TOOL_EXECUTION_FAILED,
            error_1.MCPErrorCode.SERVICE_UNAVAILABLE,
            error_1.MCPErrorCode.AUTHENTICATION_FAILED
        ];
        mcpCodes.forEach(code => {
            (0, vitest_1.expect)(code).toBeTypeOf('number');
            (0, vitest_1.expect)(code).toBeLessThan(-32000);
            (0, vitest_1.expect)(code).toBeGreaterThan(-33000);
        });
    });
});
(0, vitest_1.describe)('Message Type Detection', () => {
    (0, vitest_1.it)('should correctly identify message types', () => {
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'test'
        };
        const response = {
            jsonrpc: '2.0',
            id: 1,
            result: 'success'
        };
        const notification = {
            jsonrpc: '2.0',
            method: 'test.notification'
        };
        (0, vitest_1.expect)(messageValidator_1.MessageValidator.validateMessage(request).valid).toBe(true);
        (0, vitest_1.expect)(messageValidator_1.MessageValidator.validateMessage(response).valid).toBe(true);
        (0, vitest_1.expect)(messageValidator_1.MessageValidator.validateMessage(notification).valid).toBe(true);
    });
    (0, vitest_1.it)('should handle edge cases in message detection', () => {
        // Message with id but no method or result/error
        const ambiguous1 = {
            jsonrpc: '2.0',
            id: 1
        };
        // Message with method and id and result (invalid - should be treated as response)
        const ambiguous2 = {
            jsonrpc: '2.0',
            id: 1,
            method: 'test',
            result: 'success'
        };
        (0, vitest_1.expect)(messageValidator_1.MessageValidator.validateMessage(ambiguous1).valid).toBe(false);
        (0, vitest_1.expect)(messageValidator_1.MessageValidator.validateMessage(ambiguous2).valid).toBe(true); // This is actually a valid response
    });
});
;
//# sourceMappingURL=compliance.test.js.map