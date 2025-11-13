"use strict";
/**
 * Tests for ResourceHandler implementations
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
const ResourceHandler_1 = require("./ResourceHandler");
const error_1 = require("../types/error");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// Mock resource handler for testing abstract class
class MockResourceHandler extends ResourceHandler_1.ResourceHandler {
    mockContent;
    constructor(uri, name, mockContent = 'mock content') {
        super(uri, name, { mimeType: 'text/plain' });
        this.mockContent = mockContent;
    }
    async read(uri, params) {
        this.validateUri(uri);
        return this.createResourceContent(uri, this.mockContent);
    }
}
(0, vitest_1.describe)('ResourceHandler', () => {
    (0, vitest_1.describe)('Abstract Base Class', () => {
        let handler;
        (0, vitest_1.beforeEach)(() => {
            handler = new MockResourceHandler('test://example', 'Test Resource');
        });
        (0, vitest_1.it)('should create handler with basic properties', () => {
            const info = handler.getHandlerInfo();
            (0, vitest_1.expect)(info.type).toBe('MockResourceHandler');
            (0, vitest_1.expect)(info.uri).toBe('test://example');
            (0, vitest_1.expect)(info.name).toBe('Test Resource');
            (0, vitest_1.expect)(info.mimeType).toBe('text/plain');
            (0, vitest_1.expect)(info.capabilities).toContain('read');
        });
        (0, vitest_1.it)('should read resource content', async () => {
            const content = await handler.read('test://example');
            (0, vitest_1.expect)(content.uri).toBe('test://example');
            (0, vitest_1.expect)(content.content).toBe('mock content');
            (0, vitest_1.expect)(content.mimeType).toBe('text/plain');
            (0, vitest_1.expect)(content.size).toBeGreaterThan(0);
            (0, vitest_1.expect)(content.lastModified).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should validate URI format', async () => {
            await (0, vitest_1.expect)(handler.read('')).rejects.toThrow();
            await (0, vitest_1.expect)(handler.read('invalid-uri')).rejects.toThrow();
        });
        (0, vitest_1.it)('should throw not implemented error for list operation', async () => {
            await (0, vitest_1.expect)(handler.list?.('*')).rejects.toThrow();
        });
        (0, vitest_1.it)('should throw not implemented error for subscribe operation', async () => {
            const callback = () => { };
            await (0, vitest_1.expect)(handler.subscribe?.('test://example', callback)).rejects.toThrow();
        });
        (0, vitest_1.it)('should throw not implemented error for unsubscribe operation', async () => {
            await (0, vitest_1.expect)(handler.unsubscribe?.('test://example')).rejects.toThrow();
        });
        (0, vitest_1.it)('should create resource content with proper metadata', () => {
            const content = handler.createResourceContent('test://example', 'test content', {
                mimeType: 'application/json',
                metadata: { custom: 'value' },
                encoding: 'utf8'
            });
            (0, vitest_1.expect)(content.uri).toBe('test://example');
            (0, vitest_1.expect)(content.content).toBe('test content');
            (0, vitest_1.expect)(content.mimeType).toBe('application/json');
            (0, vitest_1.expect)(content.encoding).toBe('utf8');
            (0, vitest_1.expect)(content.metadata?.custom).toBe('value');
            (0, vitest_1.expect)(content.size).toBe(Buffer.byteLength('test content', 'utf8'));
        });
    });
    (0, vitest_1.describe)('FileResourceHandler', () => {
        let tempDir;
        let handler;
        let testFilePath;
        (0, vitest_1.beforeEach)(async () => {
            tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
            handler = new ResourceHandler_1.FileResourceHandler('file://test', 'File Handler', tempDir);
            testFilePath = path.join(tempDir, 'test.txt');
            await fs.writeFile(testFilePath, 'Hello, World!');
        });
        (0, vitest_1.afterEach)(async () => {
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            }
            catch {
                // Ignore cleanup errors
            }
        });
        (0, vitest_1.it)('should read file content', async () => {
            const uri = `file:///test.txt;
      const content = await handler.read(uri);
      
      expect(content.uri).toBe(uri);
      expect(content.content).toBe('Hello, World!');
      expect(content.mimeType).toBe('text/plain');
      expect(content.size).toBe(13);
    });

    it('should infer MIME type from file extension', async () => {
      const jsonFile = path.join(tempDir, 'test.json');
      await fs.writeFile(jsonFile, '{"test": true}');
      
      const uri = file:///test.json;
      const content = await handler.read(uri);
      
      expect(content.mimeType).toBe('application/json');
    });

    it('should list files in directory', async () => {
      const jsFile = path.join(tempDir, 'script.js');
      await fs.writeFile(jsFile, 'console.log("test");');
      
      const resources = await handler.list?.();
      expect(resources).toBeDefined();
      expect(resources!.length).toBe(2); // test.txt and script.js
      
      const txtResource = resources!.find(r => r.name === 'test.txt');
      expect(txtResource).toBeDefined();
      expect(txtResource!.mimeType).toBe('text/plain');
      expect(txtResource!.permissions?.read).toBe(true);
    });

    it('should filter files by pattern', async () => {
      const jsFile = path.join(tempDir, 'script.js');
      await fs.writeFile(jsFile, 'console.log("test");');
      
      const resources = await handler.list?.('js');
      expect(resources).toBeDefined();
      expect(resources!.length).toBe(1);
      expect(resources![0].name).toBe('script.js');
    });

    it('should prevent directory traversal attacks', async () => {
      const uri = file://../../../etc/passwd;
      await expect(handler.read(uri)).rejects.toThrow();
    });

    it('should handle file not found errors', async () => {
      const uri = file://${path.join(tempDir, 'nonexistent.txt')}`;
            await (0, vitest_1.expect)(handler.read(uri)).rejects.toThrow();
        });
        (0, vitest_1.it)('should get handler info with list capability', () => {
            const info = handler.getHandlerInfo();
            (0, vitest_1.expect)(info.type).toBe('FileResourceHandler');
            (0, vitest_1.expect)(info.capabilities).toContain('read');
            (0, vitest_1.expect)(info.capabilities).toContain('list');
        });
    });
    (0, vitest_1.describe)('DatabaseResourceHandler', () => {
        let handler;
        (0, vitest_1.beforeEach)(() => {
            handler = new ResourceHandler_1.DatabaseResourceHandler('db://test', 'Database Handler', 'postgresql://localhost:5432/test', 'users');
        });
        (0, vitest_1.it)('should read database content', async () => {
            const uri = 'db://test/users/1';
            const content = await handler.read(uri);
            (0, vitest_1.expect)(content.uri).toBe(uri);
            (0, vitest_1.expect)(content.mimeType).toBe('application/json');
            (0, vitest_1.expect)(content.content).toContain('Sample database content');
            (0, vitest_1.expect)(content.metadata?.table).toBe('users');
        });
        (0, vitest_1.it)('should list database resources', async () => {
            const resources = await handler.list?.();
            (0, vitest_1.expect)(resources).toBeDefined();
            (0, vitest_1.expect)(resources.length).toBeGreaterThan(0);
            const resource = resources[0];
            (0, vitest_1.expect)(resource.uri).toContain('db://users');
            (0, vitest_1.expect)(resource.mimeType).toBe('application/json');
            (0, vitest_1.expect)(resource.permissions?.read).toBe(true);
        });
        (0, vitest_1.it)('should filter resources by pattern', async () => {
            const resources = await handler.list?.('Record');
            (0, vitest_1.expect)(resources).toBeDefined();
            (0, vitest_1.expect)(resources.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(resources[0].name).toContain('Record');
        });
        (0, vitest_1.it)('should get handler info with list capability', () => {
            const info = handler.getHandlerInfo();
            (0, vitest_1.expect)(info.type).toBe('DatabaseResourceHandler');
            (0, vitest_1.expect)(info.capabilities).toContain('read');
            (0, vitest_1.expect)(info.capabilities).toContain('list');
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        let handler;
        (0, vitest_1.beforeEach)(() => {
            handler = new MockResourceHandler('test://example', 'Test Resource');
        });
        (0, vitest_1.it)('should handle resource errors with proper classification', () => {
            const mockError = new Error('Test error');
            mockError.code = 'ENOENT';
            try {
                handler.handleResourceError(mockError, 'read', 'test://example');
            }
            catch (error) {
                (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.RESOURCE_NOT_FOUND);
                (0, vitest_1.expect)(error.category).toBe('resource');
                (0, vitest_1.expect)(error.retryable).toBe(false);
            }
        });
        (0, vitest_1.it)('should handle access denied errors', () => {
            const mockError = new Error('Permission denied');
            mockError.code = 'EACCES';
            try {
                handler.handleResourceError(mockError, 'read', 'test://example');
            }
            catch (error) {
                (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.RESOURCE_ACCESS_DENIED);
                (0, vitest_1.expect)(error.retryable).toBe(false);
            }
        });
        (0, vitest_1.it)('should handle resource exhaustion errors', () => {
            const mockError = new Error('Too many open files');
            mockError.code = 'EMFILE';
            try {
                handler.handleResourceError(mockError, 'read', 'test://example');
            }
            catch (error) {
                (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.TOOL_RESOURCE_EXHAUSTED);
                (0, vitest_1.expect)(error.severity).toBe('high');
                (0, vitest_1.expect)(error.retryable).toBe(true);
            }
        });
        (0, vitest_1.it)('should handle timeout errors', () => {
            const mockError = new Error('Operation timed out');
            mockError.code = 'ETIMEDOUT';
            try {
                handler.handleResourceError(mockError, 'read', 'test://example');
            }
            catch (error) {
                (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.TOOL_TIMEOUT);
                (0, vitest_1.expect)(error.retryable).toBe(true);
            }
        });
        (0, vitest_1.it)('should preserve existing MCP errors', () => {
            const originalError = new (require('../types/error').MCPErrorClass)(error_1.MCPErrorCode.RESOURCE_LOCKED, 'Resource is locked');
            try {
                handler.handleResourceError(originalError, 'read', 'test://example');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBe(originalError);
                (0, vitest_1.expect)(error.code).toBe(error_1.MCPErrorCode.RESOURCE_LOCKED);
            }
        });
    });
});
//# sourceMappingURL=ResourceHandler.test.js.map