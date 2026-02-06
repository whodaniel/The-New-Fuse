/**
 * Tests for MCP Protocol Validator
 */

// @ts-expect-error - Jest globals are available without import
import { MCPValidator, mcpValidator } from './validator';

describe('MCPValidator', () => {
  let validator: MCPValidator;

  beforeEach(() => {
    validator = new MCPValidator();
  });

  describe('JSON-RPC Request Validation', () => {
    it('should validate a valid JSON-RPC request', () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
        params: { key: 'value' },
      };

      const result = validator.validateJSONRPCRequest(request);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(request);
    });

    it('should reject request without jsonrpc version', () => {
      const request = {
        id: 1,
        method: 'test.method',
      };

      const result = validator.validateJSONRPCRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("root: must have required property 'jsonrpc'");
    });

    it('should reject request with wrong jsonrpc version', () => {
      const request = {
        jsonrpc: '1.0',
        id: 1,
        method: 'test.method',
      };

      const result = validator.validateJSONRPCRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes('must be equal to constant'))).toBe(true);
    });

    it('should reject request without method', () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
      };

      const result = validator.validateJSONRPCRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("root: must have required property 'method'");
    });

    it('should accept request without params', () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.method',
      };

      const result = validator.validateJSONRPCRequest(request);
      expect(result.valid).toBe(true);
    });
  });

  describe('JSON-RPC Response Validation', () => {
    it('should validate a valid success response', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true },
      };

      const result = validator.validateJSONRPCResponse(response);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid error response', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      };

      const result = validator.validateJSONRPCResponse(response);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject response with both result and error', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true },
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      };

      const result = validator.validateJSONRPCResponse(response);
      expect(result.valid).toBe(false);
    });

    it('should reject response without result or error', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
      };

      const result = validator.validateJSONRPCResponse(response);
      expect(result.valid).toBe(false);
    });
  });

  describe('JSON-RPC Notification Validation', () => {
    it('should validate a valid notification', () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'test.notification',
        params: { message: 'hello' },
      };

      const result = validator.validateJSONRPCNotification(notification);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject notification with id', () => {
      const notification = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test.notification',
      };

      const result = validator.validateJSONRPCNotification(notification);
      expect(result.valid).toBe(false);
    });

    it('should accept notification without params', () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'test.notification',
      };

      const result = validator.validateJSONRPCNotification(notification);
      expect(result.valid).toBe(true);
    });
  });

  describe('MCP Resource Validation', () => {
    it('should validate a valid MCP resource', () => {
      const resource = {
        uri: 'file:///test.txt',
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'text/plain',
        permissions: {
          read: true,
          write: false,
        },
      };

      const result = validator.validateMCPResource(resource);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject resource without uri', () => {
      const resource = {
        name: 'Test Resource',
      };

      const result = validator.validateMCPResource(resource);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("root: must have required property 'uri'");
    });

    it('should reject resource without name', () => {
      const resource = {
        uri: 'file:///test.txt',
      };

      const result = validator.validateMCPResource(resource);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("root: must have required property 'name'");
    });
  });

  describe('MCP Tool Validation', () => {
    it('should validate a valid MCP tool', () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
          required: ['input'],
        },
      };

      const result = validator.validateMCPTool(tool);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject tool without name', () => {
      const tool = {
        description: 'A test tool',
        inputSchema: {
          type: 'object',
        },
      };

      const result = validator.validateMCPTool(tool);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("root: must have required property 'name'");
    });

    it('should reject tool without inputSchema', () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
      };

      const result = validator.validateMCPTool(tool);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("root: must have required property 'inputSchema'");
    });
  });

  describe('Custom Schema Management', () => {
    it('should add and use custom schema', () => {
      const customSchema = {
        type: 'object',
        properties: {
          customField: { type: 'string' },
        },
        required: ['customField'],
      };

      validator.addSchema('custom', customSchema);
      expect(validator.hasSchema('custom')).toBe(true);

      const validData = { customField: 'test' };
      const result = validator.validate('custom', validData);
      expect(result.valid).toBe(true);

      const invalidData = { wrongField: 'test' };
      const invalidResult = validator.validate('custom', invalidData);
      expect(invalidResult.valid).toBe(false);
    });

    it('should remove custom schema', () => {
      const customSchema = {
        type: 'object',
        properties: {
          customField: { type: 'string' },
        },
      };

      validator.addSchema('custom', customSchema);
      expect(validator.hasSchema('custom')).toBe(true);

      const removed = validator.removeSchema('custom');
      expect(removed).toBe(true);
      expect(validator.hasSchema('custom')).toBe(false);
    });

    it('should list schema names', () => {
      const schemaNames = validator.getSchemaNames();
      expect(schemaNames).toContain('jsonrpcRequest');
      expect(schemaNames).toContain('mcpResource');
      expect(schemaNames).toContain('mcpTool');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown schema gracefully', () => {
      const result = validator.validate('unknown-schema', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown schema: unknown-schema');
    });

    it('should throw error when using validateOrThrow with invalid data', () => {
      const invalidRequest = {
        jsonrpc: '1.0', // Wrong version
        id: 1,
        method: 'test',
      };

      expect(() => {
        validator.validateOrThrow('jsonrpcRequest', invalidRequest);
      }).toThrow();
    });

    it('should return data when using validateOrThrow with valid data', () => {
      const validRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      };

      const result = validator.validateOrThrow('jsonrpcRequest', validRequest);
      expect(result).toEqual(validRequest);
    });
  });
});

describe('Global Validator Instance', () => {
  it('should provide a global validator instance', () => {
    expect(mcpValidator).toBeInstanceOf(MCPValidator);
  });

  it('should validate using global instance', () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'test.method',
    };

    const result = mcpValidator.validateJSONRPCRequest(request);
    expect(result.valid).toBe(true);
  });
});
