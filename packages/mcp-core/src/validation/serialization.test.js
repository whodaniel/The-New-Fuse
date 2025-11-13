"use strict";
/**
 * Tests for Message Serialization utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const serialization_1 = require("./serialization");
const error_1 = require("../types/error");
(0, vitest_1.describe)('MessageSerializer', () => {
    (0, vitest_1.describe)('Basic Serialization', () => {
        (0, vitest_1.it)('should serialize a valid MCP request', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test.method',
                params: { key: 'value',
                    const: result = serialization_1.MessageSerializer.serialize(request),
                    expect(result) { }, : .success }
            };
        }).toBe(true);
        (0, vitest_1.expect)(result.data).toBeDefined();
        (0, vitest_1.expect)(result.metadata).toBeDefined();
        (0, vitest_1.expect)(result.metadata.originalSize).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.metadata.serializedSize).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.metadata.serializationTime).toBeGreaterThanOrEqual(0);
        // Verify the serialized data is valid JSON
        (0, vitest_1.expect)(() => JSON.parse(result.data)).not.toThrow();
    });
    (0, vitest_1.it)('should serialize a valid MCP response', () => {
        const response = {
            jsonrpc: '2.0',
            id: 1,
            result: { success: true, data: [1, 2, 3] }
        };
        const result = serialization_1.MessageSerializer.serialize(response);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.data).toBeDefined();
        const parsed = JSON.parse(result.data);
        (0, vitest_1.expect)(parsed.jsonrpc).toBe('2.0');
        (0, vitest_1.expect)(parsed.id).toBe(1);
        (0, vitest_1.expect)(parsed.result).toEqual({ success: true, data: [1, 2, 3] });
    });
    (0, vitest_1.it)('should serialize a valid MCP notification', () => {
        const notification = {
            jsonrpc: '2.0',
            method: 'test.notification',
            params: { message: 'hello',
                const: result = serialization_1.MessageSerializer.serialize(notification),
                expect(result) { }, : .success }
        };
    }).toBe(true);
    (0, vitest_1.expect)(result.data).toBeDefined();
    const parsed = JSON.parse(result.data);
    (0, vitest_1.expect)(parsed.jsonrpc).toBe('2.0');
    (0, vitest_1.expect)(parsed.method).toBe('test.notification');
    (0, vitest_1.expect)(parsed.params).toEqual({ message: 'hello' });
    (0, vitest_1.expect)(parsed.id).toBeUndefined();
});
(0, vitest_1.it)('should handle messages with metadata', () => {
    const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        meta: {
            timestamp: new Date('2023-01-01T00:00:00Z'),
            source: 'test-client',
            priority: 'high',
            const: result = serialization_1.MessageSerializer.serialize(request, { includeMeta: true }),
            expect(result) { }, : .success
        }
    };
}).toBe(true);
const parsed = JSON.parse(result.data);
(0, vitest_1.expect)(parsed.meta).toBeDefined();
(0, vitest_1.expect)(parsed.meta.timestamp).toBe('2023-01-01T00:00:00.000Z');
(0, vitest_1.expect)(parsed.meta.source).toBe('test-client');
(0, vitest_1.expect)(parsed.meta.priority).toBe('high');
;
(0, vitest_1.it)('should exclude metadata when includeMeta is false', () => {
    const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        meta: {
            timestamp: new Date(),
            source: 'test-client',
            const: result = serialization_1.MessageSerializer.serialize(request, { includeMeta: false }),
            expect(result) { }, : .success
        }
    };
}).toBe(true);
const parsed = JSON.parse(result.data);
(0, vitest_1.expect)(parsed.meta).toBeUndefined();
;
(0, vitest_1.it)('should handle pretty printing', () => {
    const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method'
    };
    const result = serialization_1.MessageSerializer.serialize(request, { prettyPrint: true });
    (0, vitest_1.expect)(result.success).toBe(true);
    (0, vitest_1.expect)(result.data).toContain('\n');
    (0, vitest_1.expect)(result.data).toContain('  ');
});
(0, vitest_1.it)('should handle serialization errors', () => {
    const circularObj = { jsonrpc: '2.0', id: 1, method: 'test' };
    circularObj.circular = circularObj;
    const result = serialization_1.MessageSerializer.serialize(circularObj);
    (0, vitest_1.expect)(result.success).toBe(false);
    (0, vitest_1.expect)(result.error).toBeDefined();
    (0, vitest_1.expect)(result.error.code).toBe(error_1.MCPErrorCode.MESSAGE_INVALID_FORMAT);
});
;
(0, vitest_1.describe)('Basic Deserialization', () => {
    (0, vitest_1.it)('should deserialize a valid MCP request', () => {
        const requestData = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'test.method',
            params: { key: 'value' }
        });
        const result = serialization_1.MessageSerializer.deserialize(requestData);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.message).toBeDefined();
        (0, vitest_1.expect)(result.metadata).toBeDefined();
        (0, vitest_1.expect)(result.metadata.serializedSize).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.metadata.deserializedSize).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.metadata.deserializationTime).toBeGreaterThanOrEqual(0);
        const message = result.message;
        (0, vitest_1.expect)(message.jsonrpc).toBe('2.0');
        (0, vitest_1.expect)(message.id).toBe(1);
        (0, vitest_1.expect)(message.method).toBe('test.method');
        (0, vitest_1.expect)(message.params).toEqual({ key: 'value' });
    });
    (0, vitest_1.it)('should deserialize with validation', () => {
        const requestData = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'test.method'
        });
        const result = serialization_1.MessageSerializer.deserialize(requestData, { validate: true });
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.message).toBeDefined();
    });
    (0, vitest_1.it)('should fail validation for invalid messages', () => {
        const invalidData = JSON.stringify({
            jsonrpc: '1.0', // Wrong version
            id: 1,
            method: 'test.method'
        });
        const result = serialization_1.MessageSerializer.deserialize(invalidData, { validate: true });
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBeDefined();
    });
    (0, vitest_1.it)('should handle Date object conversion', () => {
        const requestData = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'test.method',
            meta: {
                timestamp: '2023-01-01T00:00:00.000Z'
            }
        });
        const result = serialization_1.MessageSerializer.deserialize(requestData, { normalize: true });
        (0, vitest_1.expect)(result.success).toBe(true);
        const message = result.message;
        (0, vitest_1.expect)(message.meta?.timestamp).toBeInstanceOf(Date);
        (0, vitest_1.expect)((message.meta?.timestamp).toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });
    (0, vitest_1.it)('should handle deserialization errors', () => {
        const invalidJson = '{ invalid json }';
        const result = serialization_1.MessageSerializer.deserialize(invalidJson);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBeDefined();
        (0, vitest_1.expect)(result.error.code).toBe(error_1.MCPErrorCode.MESSAGE_INVALID_FORMAT);
    });
});
(0, vitest_1.describe)('Batch Operations', () => {
    (0, vitest_1.it)('should serialize multiple messages as batch', () => {
        const messages = [
            {
                jsonrpc: '2.0',
                id: 1,
                method: 'test.method1'
            },
            {
                jsonrpc: '2.0',
                id: 2,
                method: 'test.method2'
            }
        ];
        const result = serialization_1.MessageSerializer.serializeBatch(messages);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.data).toBeDefined();
        (0, vitest_1.expect)(result.metadata).toBeDefined();
        const parsed = JSON.parse(result.data);
        (0, vitest_1.expect)(Array.isArray(parsed)).toBe(true);
        (0, vitest_1.expect)(parsed).toHaveLength(2);
    });
    (0, vitest_1.it)('should deserialize batch of messages', () => {
        const batchData = JSON.stringify([
            JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test.method1' }),
            JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'test.method2' })
        ]);
        const results = serialization_1.MessageSerializer.deserializeBatch(batchData);
        (0, vitest_1.expect)(results).toHaveLength(2);
        (0, vitest_1.expect)(results[0].success).toBe(true);
        (0, vitest_1.expect)(results[1].success).toBe(true);
    });
    (0, vitest_1.it)('should handle batch serialization errors', () => {
        const messages = [
            { jsonrpc: '2.0', id: 1, method: 'test.method1' },
            null // Invalid message
        ];
        const result = serialization_1.MessageSerializer.serializeBatch(messages);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBeDefined();
    });
    (0, vitest_1.it)('should handle batch deserialization errors', () => {
        const invalidBatchData = '{ not an array }';
        const results = serialization_1.MessageSerializer.deserializeBatch(invalidBatchData);
        (0, vitest_1.expect)(results).toHaveLength(1);
        (0, vitest_1.expect)(results[0].success).toBe(false);
        (0, vitest_1.expect)(results[0].error).toBeDefined();
    });
});
(0, vitest_1.describe)('Roundtrip Testing', () => {
    (0, vitest_1.it)('should maintain data integrity through serialize/deserialize cycle', () => {
        const originalRequest = {
            jsonrpc: '2.0',
            id: 'test-id',
            method: 'complex.method',
            params: {
                string: 'test',
                number: 42,
                boolean: true,
                array: [1, 2, 3],
                object: { nested: 'value' },
                null: null
            },
            meta: {
                timestamp: new Date('2023-01-01T00:00:00Z'),
                source: 'test-client',
                priority: 'high',
                // Serialize
                const: serialized = serialization_1.MessageSerializer.serialize(originalRequest, { includeMeta: true }),
                expect(serialized) { }, : .success
            }
        };
    }).toBe(true);
    // Deserialize
    const deserialized = serialization_1.MessageSerializer.deserialize(serialized.data, { normalize: true });
    (0, vitest_1.expect)(deserialized.success).toBe(true);
    const message = deserialized.message;
    (0, vitest_1.expect)(message.jsonrpc).toBe(originalRequest.jsonrpc);
    (0, vitest_1.expect)(message.id).toBe(originalRequest.id);
    (0, vitest_1.expect)(message.method).toBe(originalRequest.method);
    (0, vitest_1.expect)(message.params).toEqual(originalRequest.params);
    (0, vitest_1.expect)(message.meta?.source).toBe(originalRequest.meta?.source);
    (0, vitest_1.expect)(message.meta?.priority).toBe(originalRequest.meta?.priority);
    // Compare timestamps - handle both Date and string types
    if (originalRequest.meta?.timestamp) {
        const originalTimestamp = originalRequest.meta.timestamp instanceof Date
            ? originalRequest.meta.timestamp.toISOString()
            : originalRequest.meta.timestamp;
        const messageTimestamp = message.meta?.timestamp instanceof Date
            ? message.meta.timestamp.toISOString()
            : message.meta?.timestamp;
        (0, vitest_1.expect)(messageTimestamp).toBe(originalTimestamp);
    }
});
;
;
(0, vitest_1.describe)('SerializationUtils', () => {
    (0, vitest_1.describe)('Utility Functions', () => {
        (0, vitest_1.it)('should create serializable copy', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test.method',
                meta: {
                    timestamp: new Date('2023-01-01T00:00:00Z')
                }
            };
            const copy = serialization_1.SerializationUtils.createSerializableCopy(request);
            (0, vitest_1.expect)(copy.jsonrpc).toBe(request.jsonrpc);
            (0, vitest_1.expect)(copy.id).toBe(request.id);
            (0, vitest_1.expect)(copy.method).toBe(request.method);
            (0, vitest_1.expect)(copy.meta.timestamp).toBe('2023-01-01T00:00:00.000Z');
        });
        (0, vitest_1.it)('should validate roundtrip successfully', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test.method',
                params: { key: 'value',
                    const: isValid = serialization_1.SerializationUtils.validateRoundtrip(request),
                    expect(isValid) { }, : .toBe(true)
                }
            };
        });
        (0, vitest_1.it)('should detect roundtrip failures', () => {
            const invalidMessage = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test.method'
            };
            // Add circular reference
            invalidMessage.circular = invalidMessage;
            const isValid = serialization_1.SerializationUtils.validateRoundtrip(invalidMessage);
            (0, vitest_1.expect)(isValid).toBe(false);
        });
        (0, vitest_1.it)('should calculate message size statistics', () => {
            const messages = [
                { jsonrpc: '2.0', id: 1, method: 'short' },
                { jsonrpc: '2.0', id: 2, method: 'longer.method.name', params: { data: 'value', } },
                { jsonrpc: '2.0', id: 3, method: 'medium.method' }
            ];
            const stats = serialization_1.SerializationUtils.getMessageSizeStats(messages);
            (0, vitest_1.expect)(stats.count).toBe(3);
            (0, vitest_1.expect)(stats.totalSize).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.averageSize).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.minSize).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.maxSize).toBeGreaterThan(stats.minSize);
            (0, vitest_1.expect)(stats.averageSize).toBe(stats.totalSize / 3);
        });
        (0, vitest_1.it)('should handle empty message array for statistics', () => {
            const stats = serialization_1.SerializationUtils.getMessageSizeStats([]);
            (0, vitest_1.expect)(stats.count).toBe(0);
            (0, vitest_1.expect)(stats.totalSize).toBe(0);
            (0, vitest_1.expect)(stats.averageSize).toBe(0);
            (0, vitest_1.expect)(stats.minSize).toBe(0);
            (0, vitest_1.expect)(stats.maxSize).toBe(0);
        });
    });
});
//# sourceMappingURL=serialization.test.js.map