"use strict";
/**
 * Tests for Message Validator
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const messageValidator_1 = require("./messageValidator");
const error_1 = require("../types/error");
(0, vitest_1.describe)('MessageValidator', () => {
    (0, vitest_1.describe)('Message Type Detection and Validation', () => {
        (0, vitest_1.it)('should detect and validate request message', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test.method',
                params: { key: 'value',
                    const: result = messageValidator_1.MessageValidator.validateMessage(request),
                    expect(result) { }, : .valid }
            };
        }).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
        (0, vitest_1.expect)(result.normalizedMessage).toEqual(request);
    });
    (0, vitest_1.it)('should detect and validate response message', () => {
        const response = {
            jsonrpc: '2.0',
            id: 1,
            result: { success: true }
        };
        const result = messageValidator_1.MessageValidator.validateMessage(response);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should detect and validate notification message', () => {
        const notification = {
            jsonrpc: '2.0',
            method: 'test.notification',
            params: { message: 'hello',
                const: result = messageValidator_1.MessageValidator.validateMessage(notification),
                expect(result) { }, : .valid }
        };
    }).toBe(true);
    (0, vitest_1.expect)(result.errors).toHaveLength(0);
});
(0, vitest_1.it)('should reject non-object message', () => {
    const result = messageValidator_1.MessageValidator.validateMessage('invalid');
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Message must be an object');
});
(0, vitest_1.it)('should reject message without jsonrpc version', () => {
    const message = {
        id: 1,
        method: 'test'
    };
    const result = messageValidator_1.MessageValidator.validateMessage(message);
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Message must have jsonrpc: "2.0"');
});
(0, vitest_1.it)('should reject message with wrong jsonrpc version', () => {
    const message = {
        jsonrpc: '1.0',
        id: 1,
        method: 'test'
    };
    const result = messageValidator_1.MessageValidator.validateMessage(message);
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Message must have jsonrpc: "2.0"');
});
(0, vitest_1.it)('should reject ambiguous message', () => {
    const message = {
        jsonrpc: '2.0'
        // No id, method, result, or error
    };
    const result = messageValidator_1.MessageValidator.validateMessage(message);
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Unable to determine message type');
});
;
(0, vitest_1.describe)('Request Parameter Validation', () => {
    (0, vitest_1.it)('should validate valid parameters', () => {
        const params = { key: 'value', number: 42 };
        const result = messageValidator_1.MessageValidator.validateRequestParams('test.method', params);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toEqual(params);
    });
    (0, vitest_1.it)('should accept undefined parameters', () => {
        const result = messageValidator_1.MessageValidator.validateRequestParams('test.method', undefined);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBeUndefined();
    });
    (0, vitest_1.it)('should reject circular references in parameters', () => {
        const params = { key: 'value' };
        params.circular = params; // Create circular reference
        const result = messageValidator_1.MessageValidator.validateRequestParams('test.method', params);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors[0]).toContain('Invalid parameters for method test.method');
    });
});
(0, vitest_1.describe)('Response Result Validation', () => {
    (0, vitest_1.it)('should validate valid result', () => {
        const result_data = { success: true, data: [1, 2, 3] };
        const result = messageValidator_1.MessageValidator.validateResponseResult('test.method', result_data);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toEqual(result_data);
    });
    (0, vitest_1.it)('should accept undefined result', () => {
        const result = messageValidator_1.MessageValidator.validateResponseResult('test.method', undefined);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBeUndefined();
    });
    (0, vitest_1.it)('should reject circular references in result', () => {
        const result_data = { success: true };
        result_data.circular = result_data; // Create circular reference
        const result = messageValidator_1.MessageValidator.validateResponseResult('test.method', result_data);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors[0]).toContain('Invalid result for method test.method');
    });
});
(0, vitest_1.describe)('Error Object Validation', () => {
    (0, vitest_1.it)('should validate valid error object', () => {
        const error = {
            code: -32600,
            message: 'Invalid Request',
            data: { additional: 'info',
                const: result = messageValidator_1.MessageValidator.validateError(error),
                expect(result) { }, : .valid }
        };
    }).toBe(true);
    (0, vitest_1.expect)(result.data).toEqual(error);
});
(0, vitest_1.it)('should reject error without code', () => {
    const error = {
        message: 'Invalid Request'
    };
    const result = messageValidator_1.MessageValidator.validateError(error);
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Error code must be a number');
});
(0, vitest_1.it)('should reject error without message', () => {
    const error = {
        code: -32600
    };
    const result = messageValidator_1.MessageValidator.validateError(error);
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Error message must be a string');
});
(0, vitest_1.it)('should reject non-object error', () => {
    const result = messageValidator_1.MessageValidator.validateError('not an object');
    (0, vitest_1.expect)(result.valid).toBe(false);
    (0, vitest_1.expect)(result.errors).toContain('Error must be an object');
});
;
(0, vitest_1.describe)('Message ID Validation', () => {
    (0, vitest_1.it)('should validate string ID', () => {
        const result = messageValidator_1.MessageValidator.validateMessageId('test-id');
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBe('test-id');
    });
    (0, vitest_1.it)('should validate number ID', () => {
        const result = messageValidator_1.MessageValidator.validateMessageId(42);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBe(42);
    });
    (0, vitest_1.it)('should validate null ID', () => {
        const result = messageValidator_1.MessageValidator.validateMessageId(null);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBeNull();
    });
    (0, vitest_1.it)('should validate undefined ID', () => {
        const result = messageValidator_1.MessageValidator.validateMessageId(undefined);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBeUndefined();
    });
    (0, vitest_1.it)('should reject boolean ID', () => {
        const result = messageValidator_1.MessageValidator.validateMessageId(true);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain('Message ID must be a string, number, or null');
    });
    (0, vitest_1.it)('should reject object ID', () => {
        const result = messageValidator_1.MessageValidator.validateMessageId({ id: 'test' });
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain('Message ID must be a string, number, or null');
    });
});
(0, vitest_1.describe)('Method Name Validation', () => {
    (0, vitest_1.it)('should validate valid method name', () => {
        const result = messageValidator_1.MessageValidator.validateMethodName('test.method');
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBe('test.method');
    });
    (0, vitest_1.it)('should validate method with underscores', () => {
        const result = messageValidator_1.MessageValidator.validateMethodName('test_method');
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBe('test_method');
    });
    (0, vitest_1.it)('should reject non-string method', () => {
        const result = messageValidator_1.MessageValidator.validateMethodName(123);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain('Method name must be a string');
    });
    (0, vitest_1.it)('should reject empty method name', () => {
        const result = messageValidator_1.MessageValidator.validateMethodName('');
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain('Method name cannot be empty');
    });
    (0, vitest_1.it)('should validate valid RPC method', () => {
        const result = messageValidator_1.MessageValidator.validateMethodName('rpc.discover');
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.data).toBe('rpc.discover');
    });
    (0, vitest_1.it)('should reject invalid RPC method', () => {
        const result = messageValidator_1.MessageValidator.validateMethodName('rpc.invalid');
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors).toContain('Reserved method name: rpc.invalid');
    });
});
(0, vitest_1.describe)('Validate and Normalize', () => {
    (0, vitest_1.it)('should validate and normalize valid message', () => {
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'test.method',
            params: { key: 'value',
                const: result = messageValidator_1.MessageValidator.validateAndNormalize(request),
                expect(result) { }, : .toEqual(request)
            }
        };
    });
    (0, vitest_1.it)('should throw error for invalid message', () => {
        const invalidMessage = {
            jsonrpc: '1.0', // Wrong version
            id: 1,
            method: 'test'
        };
        (0, vitest_1.expect)(() => {
            messageValidator_1.MessageValidator.validateAndNormalize(invalidMessage);
        }).toThrow();
    });
});
(0, vitest_1.describe)('Error Creation', () => {
    (0, vitest_1.it)('should create validation error with correct properties', () => {
        const error = messageValidator_1.MessageValidator.createValidationError('Test error', { test: 'data' });
        (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.MESSAGE_INVALID_FORMAT);
        (0, vitest_1.expect)(error.message).toBe('Test error');
        (0, vitest_1.expect)(error.category).toBe('validation');
        (0, vitest_1.expect)(error.severity).toBe('medium');
        (0, vitest_1.expect)(error.retryable).toBe(false);
        (0, vitest_1.expect)(error.details).toEqual({ test: 'data' });
    });
});
;
//# sourceMappingURL=messageValidator.test.js.map