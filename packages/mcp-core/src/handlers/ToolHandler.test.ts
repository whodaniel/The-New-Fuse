/**
 * Tests for ToolHandler implementations
 */

// @ts-expect-error - Jest globals are available without import
import { ToolHandler, FunctionToolHandler, ScriptToolHandler, ApiCallToolHandler } from './ToolHandler';
import { ToolResult, JSONSchema } from '../interfaces/IMCPTool';
import { MCPErrorCode } from '../types/error';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock tool handler for testing abstract class
class MockToolHandler extends ToolHandler {
  private mockResult: any;
  private shouldFail: boolean;

  constructor(
    name: string,
    description: string,
    inputSchema: JSONSchema,
    mockResult: any = { success: true },
    shouldFail: boolean = false
  ) {
    super(name, description, inputSchema);
    this.mockResult = mockResult;
    this.shouldFail = shouldFail;
  }

  async execute(params: any): Promise<ToolResult> {
    if (this.shouldFail) {
      throw new Error('Mock execution failure');
    }
    return this.createSuccessResult(this.mockResult);
  }
}

describe('ToolHandler', () => {
  describe('Abstract Base Class', () => {
    let handler: MockToolHandler;
    const inputSchema: JSONSchema = {
      type: 'object',
      properties: {
        message: { type: 'string' },
        count: { type: 'number' }
      },
      required: ['message']
    };

    beforeEach(() => {
      handler = new MockToolHandler('test-tool', 'Test Tool', inputSchema);
    });

    it('should create handler with basic properties', () => {
      const info = handler.getHandlerInfo();
      expect(info.name).toBe('test-tool');
      expect(info.description).toBe('Test Tool');
      expect(info.type).toBe('MockToolHandler');
      expect(info.inputSchema).toEqual(inputSchema);
      expect(info.capabilities).toContain('execute');
      expect(info.capabilities).toContain('validate');
      expect(info.capabilities).toContain('usage-stats');
    });

    it('should execute tool successfully', async () => {
      const params = { message: 'hello', count: 5 };
      const result = await handler.executeWithValidation(params);
      
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ success: true });
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should validate parameters against schema', async () => {
      const validParams = { message: 'hello', count: 5 };
      const validationResult = await handler.validate(validParams);
      
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });

    it('should reject invalid parameters', async () => {
      const invalidParams = { count: 5 }; // missing required 'message'
      const validationResult = await handler.validate(invalidParams);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toContain('Missing required field: message');
    });

    it('should reject parameters with wrong types', async () => {
      const invalidParams = { message: 123 }; // message should be string
      const validationResult = await handler.validate(invalidParams);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toContain('Field message: expected string, got number');
    });

    it('should handle execution failures gracefully', async () => {
      const failingHandler = new MockToolHandler('failing-tool', 'Failing Tool', inputSchema, null, true);
      const params = { message: 'hello' };
      
      const result = await failingHandler.executeWithValidation(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Mock execution failure');
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should track usage statistics', async () => {
      const params = { message: 'hello' };
      
      // Execute successfully
      await handler.executeWithValidation(params);
      await handler.executeWithValidation(params);
      
      // Execute with failure
      const failingHandler = new MockToolHandler('failing-tool', 'Failing Tool', inputSchema, null, true);
      await failingHandler.executeWithValidation(params);
      
      const successStats = await handler.getUsageStats();
      expect(successStats.totalExecutions).toBe(2);
      expect(successStats.successfulExecutions).toBe(2);
      expect(successStats.failedExecutions).toBe(0);
      expect(successStats.averageExecutionTime).toBeGreaterThanOrEqual(0);
      
      const failStats = await failingHandler.getUsageStats();
      expect(failStats.totalExecutions).toBe(1);
      expect(failStats.successfulExecutions).toBe(0);
      expect(failStats.failedExecutions).toBe(1);
    });

    it('should handle validation failures in executeWithValidation', async () => {
      const invalidParams = {}; // missing required 'message'
      const result = await handler.executeWithValidation(invalidParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Parameter validation failed');
      expect(result.metadata?.warnings).toContain('Parameter validation failed');
    });

    it('should create success and error results properly', () => {
      const successResult = (handler as any).createSuccessResult({ data: 'test' }, { custom: 'meta' });
      expect(successResult.success).toBe(true);
      expect(successResult.result).toEqual({ data: 'test' });
      expect(successResult.metadata?.toolVersion).toBe('1.0.0');
      expect(successResult.metadata?.custom).toBe('meta');

      const errorResult = (handler as any).createErrorResult('Test error', { custom: 'meta' });
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Test error');
      expect(errorResult.metadata?.toolVersion).toBe('1.0.0');
      expect(errorResult.metadata?.custom).toBe('meta');
    });
  });

  describe('FunctionToolHandler', () => {
    let handler: FunctionToolHandler;
    const inputSchema: JSONSchema = {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' }
      },
      required: ['x', 'y']
    };

    beforeEach(() => {
      const addFunction = (params: any) => {
        return { sum: params.x + params.y };
      };
      
      handler = new FunctionToolHandler(
        'add-numbers',
        'Add two numbers',
        inputSchema,
        addFunction
      );
    });

    it('should execute function successfully', async () => {
      const params = { x: 5, y: 3 };
      const result = await handler.execute(params);
      
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ sum: 8 });
    });

    it('should handle async functions', async () => {
      const asyncFunction = async (params: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { result: params.x * params.y };
      };
      
      const asyncHandler = new FunctionToolHandler(
        'multiply-numbers',
        'Multiply two numbers',
        inputSchema,
        asyncFunction
      );
      
      const params = { x: 4, y: 6 };
      const result = await asyncHandler.execute(params);
      
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ result: 24 });
    });

    it('should handle function errors', async () => {
      const errorFunction = () => {
        throw new Error('Function error');
      };
      
      const errorHandler = new FunctionToolHandler(
        'error-function',
        'Function that throws error',
        inputSchema,
        errorFunction
      );
      
      const params = { x: 1, y: 2 };
      const result = await errorHandler.execute(params);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Function error');
    });
  });

  describe('ScriptToolHandler', () => {
    let tempDir: string;
    let scriptPath: string;
    let handler: ScriptToolHandler;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-script-test-'));
      scriptPath = path.join(tempDir, 'test-script.js');
      
      // Create a simple test script
      const scriptContent = `
        const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        const result = { doubled: input.number * 2 };
        console.log(JSON.stringify(result));
      `;
      
      await fs.writeFile(scriptPath, scriptContent);
      
      const inputSchema: JSONSchema = {
        type: 'object',
        properties: {
          number: { type: 'number' }
        },
        required: ['number']
      };
      
      handler = new ScriptToolHandler(
        'double-number',
        'Double a number using script',
        inputSchema,
        scriptPath,
        'node'
      );
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should execute script successfully', async () => {
      const params = { number: 21 };
      const result = await handler.execute(params);
      
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ doubled: 42 });
    });

    it('should handle script errors', async () => {
      const errorScriptPath = path.join(tempDir, 'error-script.js');
      const errorScriptContent = `
        throw new Error('Script error');
      `;
      
      await fs.writeFile(errorScriptPath, errorScriptContent);
      
      const errorHandler = new ScriptToolHandler(
        'error-script',
        'Script that throws error',
        { type: 'object' },
        errorScriptPath,
        'node'
      );
      
      const result = await errorHandler.execute({});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Script execution failed');
    });

    it('should handle non-JSON output', async () => {
      const textScriptPath = path.join(tempDir, 'text-script.js');
      const textScriptContent = `
        console.log('Hello, World!');
      `;
      
      await fs.writeFile(textScriptPath, textScriptContent);
      
      const textHandler = new ScriptToolHandler(
        'text-script',
        'Script that outputs text',
        { type: 'object' },
        textScriptPath,
        'node'
      );
      
      const result = await textHandler.execute({});
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello, World!\n');
    });
  });

  describe('ApiCallToolHandler', () => {
    let handler: ApiCallToolHandler;
    const inputSchema: JSONSchema = {
      type: 'object',
      properties: {
        method: { type: 'string' },
        path: { type: 'string' },
        body: { type: 'object' }
      }
    };

    beforeEach(() => {
      handler = new ApiCallToolHandler(
        'api-call',
        'Make API calls',
        inputSchema,
        'https://jsonplaceholder.typicode.com',
        { 'Content-Type': 'application/json' }
      );
    });

    it('should make successful API call', async () => {
      const params = {
        method: 'GET',
        path: '/posts/1'
      };
      
      const result = await handler.execute(params);
      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('id');
      expect(result.metadata?.status).toBe(200);
    });

    it('should handle API errors', async () => {
      const params = {
        method: 'GET',
        path: '/nonexistent'
      };
      
      const result = await handler.execute(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('API call failed');
      expect(result.metadata?.status).toBe(404);
    });

    it('should handle POST requests with body', async () => {
      const params = {
        method: 'POST',
        path: '/posts',
        body: {
          title: 'Test Post',
          body: 'This is a test post',
          userId: 1
        }
      };
      
      const result = await handler.execute(params);
      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('id');
      expect(result.metadata?.status).toBe(201);
    });

    it('should handle network errors', async () => {
      const badHandler = new ApiCallToolHandler(
        'bad-api-call',
        'Make API calls to bad endpoint',
        inputSchema,
        'https://nonexistent-domain-12345.com'
      );
      
      const params = {
        method: 'GET',
        path: '/test'
      };
      
      const result = await badHandler.execute(params);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    let handler: MockToolHandler;

    beforeEach(() => {
      handler = new MockToolHandler('test-tool', 'Test Tool', { type: 'object' });
    });

    it('should handle tool errors with proper classification', () => {
      const mockError = new Error('Test error');
      (mockError as any).code = 'ETIMEDOUT';

      try {
        (handler as any).handleToolError(mockError, 'execute');
      } catch (error: any) {
        expect(error.code).toBe(MCPErrorCode.TOOL_TIMEOUT);
        expect(error.category).toBe('tool');
        expect(error.retryable).toBe(true);
      }
    });

    it('should handle permission denied errors', () => {
      const mockError = new Error('Permission denied');
      (mockError as any).code = 'EACCES';

      try {
        (handler as any).handleToolError(mockError, 'execute');
      } catch (error: any) {
        expect(error.code).toBe(MCPErrorCode.TOOL_PERMISSION_DENIED);
        expect(error.severity).toBe('high');
        expect(error.retryable).toBe(false);
      }
    });

    it('should handle resource exhaustion errors', () => {
      const mockError = new Error('Too many open files');
      (mockError as any).code = 'EMFILE';

      try {
        (handler as any).handleToolError(mockError, 'execute');
      } catch (error: any) {
        expect(error.code).toBe(MCPErrorCode.TOOL_RESOURCE_EXHAUSTED);
        expect(error.severity).toBe('high');
        expect(error.retryable).toBe(true);
      }
    });

    it('should preserve existing MCP errors', () => {
      const originalError = new (require('../types/error').MCPErrorClass)(
        MCPErrorCode.TOOL_EXECUTION_FAILED,
        'Tool execution failed'
      );

      try {
        (handler as any).handleToolError(originalError, 'execute');
      } catch (error: any) {
        expect(error).toBe(originalError);
        expect(error.code).toBe(MCPErrorCode.TOOL_EXECUTION_FAILED);
      }
    });
  });
});