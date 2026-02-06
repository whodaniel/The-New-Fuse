/**
 * Tests for Message Validator
 */

// @ts-expect-error - Jest globals are available without import
import { MCPErrorCode } from '../types/error';
import { MessageValidator } from './messageValidator';

describe('MessageValidator', () => {
  describe('Message Type Detection and Validation', () => {
    it('should detect and validate request message', () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        params: { key: 'value' },
      };

      const result = MessageValidator.validateMessage(request);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedMessage).toEqual(request);
    });

    it('should detect and validate response message', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true },
      };

      const result = MessageValidator.validateMessage(response);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect and validate notification message', () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'test.notification',
        params: { message: 'hello' },
      };

      const result = MessageValidator.validateMessage(notification);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object message', () => {
      const result = MessageValidator.validateMessage('invalid');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must be an object');
    });

    it('should reject message without jsonrpc version', () => {
      const message = {
        id: 1,
        method: 'test',
      };

      const result = MessageValidator.validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must have jsonrpc: "2.0"');
    });

    it('should reject message with wrong jsonrpc version', () => {
      const message = {
        jsonrpc: '1.0',
        id: 1,
        method: 'test',
      };

      const result = MessageValidator.validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must have jsonrpc: "2.0"');
    });

    it('should reject ambiguous message', () => {
      const message = {
        jsonrpc: '2.0',
        // No id, method, result, or error
      };

      const result = MessageValidator.validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unable to determine message type');
    });
  });

  describe('Request Parameter Validation', () => {
    it('should validate valid parameters', () => {
      const params = { key: 'value', number: 42 };
      const result = MessageValidator.validateRequestParams('test.method', params);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(params);
    });

    it('should accept undefined parameters', () => {
      const result = MessageValidator.validateRequestParams('test.method', undefined);
      expect(result.valid).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should reject circular references in parameters', () => {
      const params: any = { key: 'value' };
      params.circular = params; // Create circular reference

      const result = MessageValidator.validateRequestParams('test.method', params);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid parameters for method test.method');
    });
  });

  describe('Response Result Validation', () => {
    it('should validate valid result', () => {
      const result_data = { success: true, data: [1, 2, 3] };
      const result = MessageValidator.validateResponseResult('test.method', result_data);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(result_data);
    });

    it('should accept undefined result', () => {
      const result = MessageValidator.validateResponseResult('test.method', undefined);
      expect(result.valid).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should reject circular references in result', () => {
      const result_data: any = { success: true };
      result_data.circular = result_data; // Create circular reference

      const result = MessageValidator.validateResponseResult('test.method', result_data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid result for method test.method');
    });
  });

  describe('Error Object Validation', () => {
    it('should validate valid error object', () => {
      const error = {
        code: -32600,
        message: 'Invalid Request',
        data: { additional: 'info' },
      };

      const result = MessageValidator.validateError(error);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(error);
    });

    it('should reject error without code', () => {
      const error = {
        message: 'Invalid Request',
      };

      const result = MessageValidator.validateError(error);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Error code must be a number');
    });

    it('should reject error without message', () => {
      const error = {
        code: -32600,
      };

      const result = MessageValidator.validateError(error);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Error message must be a string');
    });

    it('should reject non-object error', () => {
      const result = MessageValidator.validateError('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Error must be an object');
    });
  });

  describe('Message ID Validation', () => {
    it('should validate string ID', () => {
      const result = MessageValidator.validateMessageId('test-id');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('test-id');
    });

    it('should validate number ID', () => {
      const result = MessageValidator.validateMessageId(42);
      expect(result.valid).toBe(true);
      expect(result.data).toBe(42);
    });

    it('should validate null ID', () => {
      const result = MessageValidator.validateMessageId(null);
      expect(result.valid).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should validate undefined ID', () => {
      const result = MessageValidator.validateMessageId(undefined);
      expect(result.valid).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should reject boolean ID', () => {
      const result = MessageValidator.validateMessageId(true);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message ID must be a string, number, or null');
    });

    it('should reject object ID', () => {
      const result = MessageValidator.validateMessageId({ id: 'test' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message ID must be a string, number, or null');
    });
  });

  describe('Method Name Validation', () => {
    it('should validate valid method name', () => {
      const result = MessageValidator.validateMethodName('test.method');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('test.method');
    });

    it('should validate method with underscores', () => {
      const result = MessageValidator.validateMethodName('test_method');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('test_method');
    });

    it('should reject non-string method', () => {
      const result = MessageValidator.validateMethodName(123);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Method name must be a string');
    });

    it('should reject empty method name', () => {
      const result = MessageValidator.validateMethodName('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Method name cannot be empty');
    });

    it('should validate valid RPC method', () => {
      const result = MessageValidator.validateMethodName('rpc.discover');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('rpc.discover');
    });

    it('should reject invalid RPC method', () => {
      const result = MessageValidator.validateMethodName('rpc.invalid');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Reserved method name: rpc.invalid');
    });
  });

  describe('Validate and Normalize', () => {
    it('should validate and normalize valid message', () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        params: { key: 'value' },
      };

      const result = MessageValidator.validateAndNormalize(request);
      expect(result).toEqual(request);
    });

    it('should throw error for invalid message', () => {
      const invalidMessage = {
        jsonrpc: '1.0', // Wrong version
        id: 1,
        method: 'test',
      };

      expect(() => {
        MessageValidator.validateAndNormalize(invalidMessage);
      }).toThrow();
    });
  });

  describe('Error Creation', () => {
    it('should create validation error with correct properties', () => {
      const error = MessageValidator.createValidationError('Test error', { test: 'data' });

      expect(error.code).toBe(MCPErrorCode.MESSAGE_INVALID_FORMAT);
      expect(error.message).toBe('Test error');
      expect(error.category).toBe('validation');
      expect(error.severity).toBe('medium');
      expect(error.retryable).toBe(false);
      expect(error.details).toEqual({ test: 'data' });
    });
  });
});
