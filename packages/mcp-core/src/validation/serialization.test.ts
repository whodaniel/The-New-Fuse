/**
 * Tests for Message Serialization utilities
 */

// @ts-expect-error - Jest globals are available without import
import { MessageSerializer, SerializationUtils } from './serialization';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage';
import { MCPErrorCode } from '../types/error';

describe('MessageSerializer', () => {
  describe('Basic Serialization', () => {
    it('should serialize a valid MCP request', () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        params: { key: 'value' }
      };

      const result = MessageSerializer.serialize(request);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.originalSize).toBeGreaterThan(0);
      expect(result.metadata!.serializedSize).toBeGreaterThan(0);
      expect(result.metadata!.serializationTime).toBeGreaterThanOrEqual(0);

      // Verify the serialized data is valid JSON
      expect(() => JSON.parse(result.data!)).not.toThrow();
    });

    it('should serialize a valid MCP response', () => {
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true, data: [1, 2, 3] }
      };

      const result = MessageSerializer.serialize(response);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const parsed = JSON.parse(result.data!);
      expect(parsed.jsonrpc).toBe('2.0');
      expect(parsed.id).toBe(1);
      expect(parsed.result).toEqual({ success: true, data: [1, 2, 3] });
    });

    it('should serialize a valid MCP notification', () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'test.notification',
        params: { message: 'hello' }
      };

      const result = MessageSerializer.serialize(notification);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const parsed = JSON.parse(result.data!);
      expect(parsed.jsonrpc).toBe('2.0');
      expect(parsed.method).toBe('test.notification');
      expect(parsed.params).toEqual({ message: 'hello' });
      expect(parsed.id).toBeUndefined();
    });

    it('should handle messages with metadata', () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        meta: {
          timestamp: new Date('2023-01-01T00:00:00Z'),
          source: 'test-client',
          priority: 'high'
        }
      };

      const result = MessageSerializer.serialize(request, { includeMeta: true });
      expect(result.success).toBe(true);
      
      const parsed = JSON.parse(result.data!);
      expect(parsed.meta).toBeDefined();
      expect(parsed.meta.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(parsed.meta.source).toBe('test-client');
      expect(parsed.meta.priority).toBe('high');
    });

    it('should exclude metadata when includeMeta is false', () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        meta: {
          timestamp: new Date(),
          source: 'test-client'
        }
      };

      const result = MessageSerializer.serialize(request, { includeMeta: false });
      expect(result.success).toBe(true);
      
      const parsed = JSON.parse(result.data!);
      expect(parsed.meta).toBeUndefined();
    });

    it('should handle pretty printing', () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method'
      };

      const result = MessageSerializer.serialize(request, { prettyPrint: true });
      expect(result.success).toBe(true);
      expect(result.data).toContain('\n');
      expect(result.data).toContain('  ');
    });

    it('should handle serialization errors', () => {
      const circularObj: any = { jsonrpc: '2.0', id: 1, method: 'test' };
      circularObj.circular = circularObj;

      const result = MessageSerializer.serialize(circularObj);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(MCPErrorCode.MESSAGE_INVALID_FORMAT);
    });
  });

  describe('Basic Deserialization', () => {
    it('should deserialize a valid MCP request', () => {
      const requestData = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        params: { key: 'value' }
      });

      const result = MessageSerializer.deserialize(requestData);
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.serializedSize).toBeGreaterThan(0);
      expect(result.metadata!.deserializedSize).toBeGreaterThan(0);
      expect(result.metadata!.deserializationTime).toBeGreaterThanOrEqual(0);

      const message = result.message as MCPRequest;
      expect(message.jsonrpc).toBe('2.0');
      expect(message.id).toBe(1);
      expect(message.method).toBe('test.method');
      expect(message.params).toEqual({ key: 'value' });
    });

    it('should deserialize with validation', () => {
      const requestData = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method'
      });

      const result = MessageSerializer.deserialize(requestData, { validate: true });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should fail validation for invalid messages', () => {
      const invalidData = JSON.stringify({
        jsonrpc: '1.0', // Wrong version
        id: 1,
        method: 'test.method'
      });

      const result = MessageSerializer.deserialize(invalidData, { validate: true });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle Date object conversion', () => {
      const requestData = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        meta: {
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      });

      const result = MessageSerializer.deserialize(requestData, { normalize: true });
      expect(result.success).toBe(true);
      
      const message = result.message as MCPRequest;
      expect(message.meta?.timestamp).toBeInstanceOf(Date);
      expect((message.meta?.timestamp as Date).toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle deserialization errors', () => {
      const invalidJson = '{ invalid json }';

      const result = MessageSerializer.deserialize(invalidJson);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(MCPErrorCode.MESSAGE_INVALID_FORMAT);
    });
  });

  describe('Batch Operations', () => {
    it('should serialize multiple messages as batch', () => {
      const messages = [
        {
          jsonrpc: '2.0' as const,
          id: 1,
          method: 'test.method1'
        },
        {
          jsonrpc: '2.0' as const,
          id: 2,
          method: 'test.method2'
        }
      ];

      const result = MessageSerializer.serializeBatch(messages);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();

      const parsed = JSON.parse(result.data!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('should deserialize batch of messages', () => {
      const batchData = JSON.stringify([
        JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test.method1' }),
        JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'test.method2' })
      ]);

      const results = MessageSerializer.deserializeBatch(batchData);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle batch serialization errors', () => {
      const messages = [
        { jsonrpc: '2.0' as const, id: 1, method: 'test.method1' },
        null as any // Invalid message
      ];

      const result = MessageSerializer.serializeBatch(messages);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle batch deserialization errors', () => {
      const invalidBatchData = '{ not an array }';

      const results = MessageSerializer.deserializeBatch(invalidBatchData);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('Roundtrip Testing', () => {
    it('should maintain data integrity through serialize/deserialize cycle', () => {
      const originalRequest: MCPRequest = {
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
          priority: 'high'
        }
      };

      // Serialize
      const serialized = MessageSerializer.serialize(originalRequest, { includeMeta: true });
      expect(serialized.success).toBe(true);

      // Deserialize
      const deserialized = MessageSerializer.deserialize(serialized.data!, { normalize: true });
      expect(deserialized.success).toBe(true);

      const message = deserialized.message as MCPRequest;
      expect(message.jsonrpc).toBe(originalRequest.jsonrpc);
      expect(message.id).toBe(originalRequest.id);
      expect(message.method).toBe(originalRequest.method);
      expect(message.params).toEqual(originalRequest.params);
      expect(message.meta?.source).toBe(originalRequest.meta?.source);
      expect(message.meta?.priority).toBe(originalRequest.meta?.priority);
      // Compare timestamps - handle both Date and string types
      if (originalRequest.meta?.timestamp) {
        const originalTimestamp = originalRequest.meta.timestamp instanceof Date 
          ? originalRequest.meta.timestamp.toISOString() 
          : originalRequest.meta.timestamp;
        const messageTimestamp = message.meta?.timestamp instanceof Date 
          ? message.meta.timestamp.toISOString() 
          : message.meta?.timestamp;
        expect(messageTimestamp).toBe(originalTimestamp);
      }
    });
  });
});

describe('SerializationUtils', () => {
  describe('Utility Functions', () => {
    it('should create serializable copy', () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        meta: {
          timestamp: new Date('2023-01-01T00:00:00Z')
        }
      };

      const copy = SerializationUtils.createSerializableCopy(request);
      expect(copy.jsonrpc).toBe(request.jsonrpc);
      expect(copy.id).toBe(request.id);
      expect(copy.method).toBe(request.method);
      expect(copy.meta.timestamp).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should validate roundtrip successfully', () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        params: { key: 'value' }
      };

      const isValid = SerializationUtils.validateRoundtrip(request);
      expect(isValid).toBe(true);
    });

    it('should detect roundtrip failures', () => {
      const invalidMessage: any = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method'
      };
      // Add circular reference
      invalidMessage.circular = invalidMessage;

      const isValid = SerializationUtils.validateRoundtrip(invalidMessage);
      expect(isValid).toBe(false);
    });

    it('should calculate message size statistics', () => {
      const messages = [
        { jsonrpc: '2.0' as const, id: 1, method: 'short' },
        { jsonrpc: '2.0' as const, id: 2, method: 'longer.method.name', params: { data: 'value' } },
        { jsonrpc: '2.0' as const, id: 3, method: 'medium.method' }
      ];

      const stats = SerializationUtils.getMessageSizeStats(messages);
      expect(stats.count).toBe(3);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.averageSize).toBeGreaterThan(0);
      expect(stats.minSize).toBeGreaterThan(0);
      expect(stats.maxSize).toBeGreaterThan(stats.minSize);
      expect(stats.averageSize).toBe(stats.totalSize / 3);
    });

    it('should handle empty message array for statistics', () => {
      const stats = SerializationUtils.getMessageSizeStats([]);
      expect(stats.count).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSize).toBe(0);
      expect(stats.minSize).toBe(0);
      expect(stats.maxSize).toBe(0);
    });
  });
});