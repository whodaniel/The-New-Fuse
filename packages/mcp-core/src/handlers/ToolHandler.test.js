"use strict";
/**
 * Tests for ToolHandler implementations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ToolHandler_1 = require("./ToolHandler");
const error_1 = require("../types/error");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// Mock tool handler for testing abstract class
class MockToolHandler extends ToolHandler_1.ToolHandler {
    mockResult;
    shouldFail;
    constructor(name, description, inputSchema, mockResult = { success: true }, shouldFail = false) {
        super(name, description, inputSchema);
        this.mockResult = mockResult;
        this.shouldFail = shouldFail;
    }
    async execute(params) {
        if (this.shouldFail) {
            throw new Error('Mock execution failure');
        }
        return this.createSuccessResult(this.mockResult);
    }
}
(0, vitest_1.describe)('ToolHandler', () => {
    (0, vitest_1.describe)('Abstract Base Class', () => {
        let handler;
        const inputSchema = {
            type: 'object',
            properties: {
                message: { type: 'string' },
                count: { type: 'number',
                    required: ['message']
                },
                beforeEach() { }
            }()
        };
        {
            handler = new MockToolHandler('test-tool', 'Test Tool', inputSchema);
        }
    });
    (0, vitest_1.it)('should create handler with basic properties', () => {
        const info = handler.getHandlerInfo();
        (0, vitest_1.expect)(info.name).toBe('test-tool');
        (0, vitest_1.expect)(info.description).toBe('Test Tool');
        (0, vitest_1.expect)(info.type).toBe('MockToolHandler');
        (0, vitest_1.expect)(info.inputSchema).toEqual(inputSchema);
        (0, vitest_1.expect)(info.capabilities).toContain('execute');
        (0, vitest_1.expect)(info.capabilities).toContain('validate');
        (0, vitest_1.expect)(info.capabilities).toContain('usage-stats');
    });
    (0, vitest_1.it)('should execute tool successfully', async () => {
        const params = { message: 'hello', count: 5 };
        const result = await handler.executeWithValidation(params);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.result).toEqual({ success: true });
        (0, vitest_1.expect)(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should validate parameters against schema', async () => {
        const validParams = { message: 'hello', count: 5 };
        const validationResult = await handler.validate(validParams);
        (0, vitest_1.expect)(validationResult.valid).toBe(true);
        (0, vitest_1.expect)(validationResult.errors).toBeUndefined();
    });
    (0, vitest_1.it)('should reject invalid parameters', async () => {
        const invalidParams = { count: 5 }; // missing required 'message'
        const validationResult = await handler.validate(invalidParams);
        (0, vitest_1.expect)(validationResult.valid).toBe(false);
        (0, vitest_1.expect)(validationResult.errors).toContain('Missing required field: message');
    });
    (0, vitest_1.it)('should reject parameters with wrong types', async () => {
        const invalidParams = { message: 123 }; // message should be string
        const validationResult = await handler.validate(invalidParams);
        (0, vitest_1.expect)(validationResult.valid).toBe(false);
        (0, vitest_1.expect)(validationResult.errors).toContain('Field message: expected string, got number');
    });
    (0, vitest_1.it)('should handle execution failures gracefully', async () => {
        const failingHandler = new MockToolHandler('failing-tool', 'Failing Tool', inputSchema, null, true);
        const params = { message: 'hello' };
        const result = await failingHandler.executeWithValidation(params);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('Mock execution failure');
        (0, vitest_1.expect)(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should track usage statistics', async () => {
        const params = { message: 'hello' };
        // Execute successfully
        await handler.executeWithValidation(params);
        await handler.executeWithValidation(params);
        // Execute with failure
        const failingHandler = new MockToolHandler('failing-tool', 'Failing Tool', inputSchema, null, true);
        await failingHandler.executeWithValidation(params);
        const successStats = await handler.getUsageStats();
        (0, vitest_1.expect)(successStats.totalExecutions).toBe(2);
        (0, vitest_1.expect)(successStats.successfulExecutions).toBe(2);
        (0, vitest_1.expect)(successStats.failedExecutions).toBe(0);
        (0, vitest_1.expect)(successStats.averageExecutionTime).toBeGreaterThanOrEqual(0);
        const failStats = await failingHandler.getUsageStats();
        (0, vitest_1.expect)(failStats.totalExecutions).toBe(1);
        (0, vitest_1.expect)(failStats.successfulExecutions).toBe(0);
        (0, vitest_1.expect)(failStats.failedExecutions).toBe(1);
    });
    (0, vitest_1.it)('should handle validation failures in executeWithValidation', async () => {
        const invalidParams = {}; // missing required 'message'
        const result = await handler.executeWithValidation(invalidParams);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('Parameter validation failed');
        (0, vitest_1.expect)(result.metadata?.warnings).toContain('Parameter validation failed');
    });
    (0, vitest_1.it)('should create success and error results properly', () => {
        const successResult = handler.createSuccessResult({ data: 'test' }, { custom: 'meta' });
        (0, vitest_1.expect)(successResult.success).toBe(true);
        (0, vitest_1.expect)(successResult.result).toEqual({ data: 'test' });
        (0, vitest_1.expect)(successResult.metadata?.toolVersion).toBe('1.0.0');
        (0, vitest_1.expect)(successResult.metadata?.custom).toBe('meta');
        const errorResult = handler.createErrorResult('Test error', { custom: 'meta' });
        (0, vitest_1.expect)(errorResult.success).toBe(false);
        (0, vitest_1.expect)(errorResult.error).toBe('Test error');
        (0, vitest_1.expect)(errorResult.metadata?.toolVersion).toBe('1.0.0');
        (0, vitest_1.expect)(errorResult.metadata?.custom).toBe('meta');
    });
});
(0, vitest_1.describe)('FunctionToolHandler', () => {
    let handler;
    const inputSchema = {
        type: 'object',
        properties: {
            x: { type: 'number' },
            y: { type: 'number',
                required: ['x', 'y']
            },
            beforeEach() { }
        }()
    };
    {
        const addFunction = (params) => {
            return { sum: params.x + params.y };
        };
        handler = new ToolHandler_1.FunctionToolHandler('add-numbers', 'Add two numbers', inputSchema, addFunction);
    }
});
(0, vitest_1.it)('should execute function successfully', async () => {
    const params = { x: 5, y: 3 };
    const result = await handler.execute(params);
    (0, vitest_1.expect)(result.success).toBe(true);
    (0, vitest_1.expect)(result.result).toEqual({ sum: 8 });
});
(0, vitest_1.it)('should handle async functions', async () => {
    const asyncFunction = async (params) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { result: params.x * params.y };
    };
    const asyncHandler = new ToolHandler_1.FunctionToolHandler('multiply-numbers', 'Multiply two numbers', inputSchema, asyncFunction);
    const params = { x: 4, y: 6 };
    const result = await asyncHandler.execute(params);
    (0, vitest_1.expect)(result.success).toBe(true);
    (0, vitest_1.expect)(result.result).toEqual({ result: 24 });
});
(0, vitest_1.it)('should handle function errors', async () => {
    const errorFunction = () => {
        throw new Error('Function error');
    };
    const errorHandler = new ToolHandler_1.FunctionToolHandler('error-function', 'Function that throws error', inputSchema, errorFunction);
    const params = { x: 1, y: 2 };
    const result = await errorHandler.execute(params);
    (0, vitest_1.expect)(result.success).toBe(false);
    (0, vitest_1.expect)(result.error).toContain('Function error');
});
;
(0, vitest_1.describe)('ScriptToolHandler', () => {
    let tempDir;
    let scriptPath;
    let handler;
    (0, vitest_1.beforeEach)(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-script-test-'));
        scriptPath = path.join(tempDir, 'test-script.js');
        // Create a simple test script
        const scriptContent = `
        const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        const result = { doubled: input.number * 2 };
        console.log(JSON.stringify(result));
      ;
      
      await fs.writeFile(scriptPath, scriptContent);
      
      const inputSchema: JSONSchema = {
        type: 'object',
        properties: {
          number: { type: 'number',
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
      const errorScriptContent = 
        throw new Error('Script error');
      ;
      
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
      const textScriptContent = 
        console.log('Hello, World!');
      `;
        await fs.writeFile(textScriptPath, textScriptContent);
        const textHandler = new ToolHandler_1.ScriptToolHandler('text-script', 'Script that outputs text', { type: 'object' }, textScriptPath, 'node');
        const result = await textHandler.execute({});
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.result).toBe('Hello, World!\n');
    });
});
(0, vitest_1.describe)('ApiCallToolHandler', () => {
    let handler;
    const inputSchema = {
        type: 'object',
        properties: {
            method: { type: 'string' },
            path: { type: 'string' },
            body: { type: 'object'
            },
            beforeEach() { }
        }()
    };
    {
        handler = new ToolHandler_1.ApiCallToolHandler('api-call', 'Make API calls', inputSchema, 'https://jsonplaceholder.typicode.com', { 'Content-Type': 'application/json' });
    }
});
(0, vitest_1.it)('should make successful API call', async () => {
    const params = {
        method: 'GET',
        path: '/posts/1'
    };
    const result = await handler.execute(params);
    (0, vitest_1.expect)(result.success).toBe(true);
    (0, vitest_1.expect)(result.result).toHaveProperty('id');
    (0, vitest_1.expect)(result.metadata?.status).toBe(200);
});
(0, vitest_1.it)('should handle API errors', async () => {
    const params = {
        method: 'GET',
        path: '/nonexistent'
    };
    const result = await handler.execute(params);
    (0, vitest_1.expect)(result.success).toBe(false);
    (0, vitest_1.expect)(result.error).toContain('API call failed');
    (0, vitest_1.expect)(result.metadata?.status).toBe(404);
});
(0, vitest_1.it)('should handle POST requests with body', async () => {
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
    (0, vitest_1.expect)(result.success).toBe(true);
    (0, vitest_1.expect)(result.result).toHaveProperty('id');
    (0, vitest_1.expect)(result.metadata?.status).toBe(201);
});
(0, vitest_1.it)('should handle network errors', async () => {
    const badHandler = new ToolHandler_1.ApiCallToolHandler('bad-api-call', 'Make API calls to bad endpoint', inputSchema, 'https://nonexistent-domain-12345.com');
    const params = {
        method: 'GET',
        path: '/test'
    };
    const result = await badHandler.execute(params);
    (0, vitest_1.expect)(result.success).toBe(false);
    (0, vitest_1.expect)(result.error).toBeDefined();
});
;
(0, vitest_1.describe)('Error Handling', () => {
    let handler;
    (0, vitest_1.beforeEach)(() => {
        handler = new MockToolHandler('test-tool', 'Test Tool', { type: 'object' });
    });
    (0, vitest_1.it)('should handle tool errors with proper classification', () => {
        const mockError = new Error('Test error');
        mockError.code = 'ETIMEDOUT';
        try {
            handler.handleToolError(mockError, 'execute');
        }
        catch (error) {
            (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.TOOL_TIMEOUT);
            (0, vitest_1.expect)(error.category).toBe('tool');
            (0, vitest_1.expect)(error.retryable).toBe(true);
        }
    });
    (0, vitest_1.it)('should handle permission denied errors', () => {
        const mockError = new Error('Permission denied');
        mockError.code = 'EACCES';
        try {
            handler.handleToolError(mockError, 'execute');
        }
        catch (error) {
            (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.TOOL_PERMISSION_DENIED);
            (0, vitest_1.expect)(error.severity).toBe('high');
            (0, vitest_1.expect)(error.retryable).toBe(false);
        }
    });
    (0, vitest_1.it)('should handle resource exhaustion errors', () => {
        const mockError = new Error('Too many open files');
        mockError.code = 'EMFILE';
        try {
            handler.handleToolError(mockError, 'execute');
        }
        catch (error) {
            (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.TOOL_RESOURCE_EXHAUSTED);
            (0, vitest_1.expect)(error.severity).toBe('high');
            (0, vitest_1.expect)(error.retryable).toBe(true);
        }
    });
    (0, vitest_1.it)('should preserve existing MCP errors', () => {
        const originalError = new (require('../types/error').MCPErrorClass)(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Tool execution failed');
        try {
            handler.handleToolError(originalError, 'execute');
        }
        catch (error) {
            (0, vitest_1.expect)(error).toBe(originalError);
            (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED);
        }
    });
});
;
//# sourceMappingURL=ToolHandler.test.js.map