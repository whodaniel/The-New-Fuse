/**
 * Tests for ResourceHandler implementations
 */

// @ts-expect-error - Jest globals are available without import
import { ResourceHandler, FileResourceHandler, DatabaseResourceHandler } from './ResourceHandler';
import { MCPErrorCode } from '../types/error';
import { ResourceContent, MCPResource } from '../interfaces/IMCPResource';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock resource handler for testing abstract class
class MockResourceHandler extends ResourceHandler {
  private mockContent: string;

  constructor(uri: string, name: string, mockContent: string = 'mock content') {
    super(uri, name, { mimeType: 'text/plain' });
    this.mockContent = mockContent;
  }

  async read(uri: string, params?: any): Promise<ResourceContent> {
    this.validateUri(uri);
    return this.createResourceContent(uri, this.mockContent);
  }
}

describe('ResourceHandler', () => {
  describe('Abstract Base Class', () => {
    let handler: MockResourceHandler;

    beforeEach(() => {
      handler = new MockResourceHandler('test://example', 'Test Resource');
    });

    it('should create handler with basic properties', () => {
      const info = handler.getHandlerInfo();
      expect(info.type).toBe('MockResourceHandler');
      expect(info.uri).toBe('test://example');
      expect(info.name).toBe('Test Resource');
      expect(info.mimeType).toBe('text/plain');
      expect(info.capabilities).toContain('read');
    });

    it('should read resource content', async () => {
      const content = await handler.read('test://example');
      expect(content.uri).toBe('test://example');
      expect(content.content).toBe('mock content');
      expect(content.mimeType).toBe('text/plain');
      expect(content.size).toBeGreaterThan(0);
      expect(content.lastModified).toBeInstanceOf(Date);
    });

    it('should validate URI format', async () => {
      await expect(handler.read('')).rejects.toThrow();
      await expect(handler.read('invalid-uri')).rejects.toThrow();
    });

    it('should throw not implemented error for list operation', async () => {
      await expect(handler.list?.('*')).rejects.toThrow();
    });

    it('should throw not implemented error for subscribe operation', async () => {
      const callback = () => {};
      await expect(handler.subscribe?.('test://example', callback)).rejects.toThrow();
    });

    it('should throw not implemented error for unsubscribe operation', async () => {
      await expect(handler.unsubscribe?.('test://example')).rejects.toThrow();
    });

    it('should create resource content with proper metadata', () => {
      const content = (handler as any).createResourceContent(
        'test://example',
        'test content',
        {
          mimeType: 'application/json',
          metadata: { custom: 'value' },
          encoding: 'utf8'
        }
      );

      expect(content.uri).toBe('test://example');
      expect(content.content).toBe('test content');
      expect(content.mimeType).toBe('application/json');
      expect(content.encoding).toBe('utf8');
      expect(content.metadata?.custom).toBe('value');
      expect(content.size).toBe(Buffer.byteLength('test content', 'utf8'));
    });
  });

  describe('FileResourceHandler', () => {
    let tempDir: string;
    let handler: FileResourceHandler;
    let testFilePath: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
      handler = new FileResourceHandler('file://test', 'File Handler', tempDir);
      testFilePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFilePath, 'Hello, World!');
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should read file content', async () => {
      const uri = `file:///test.txt`;
      const content = await handler.read(uri);
      
      expect(content.uri).toBe(uri);
      expect(content.content).toBe('Hello, World!');
      expect(content.mimeType).toBe('text/plain');
      expect(content.size).toBe(13);
    });

    it('should infer MIME type from file extension', async () => {
      const jsonFile = path.join(tempDir, 'test.json');
      await fs.writeFile(jsonFile, '{"test": true}');
      
      const uri = `file:///test.json`;
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
      const uri = `file://../../../etc/passwd`;
      await expect(handler.read(uri)).rejects.toThrow();
    });

    it('should handle file not found errors', async () => {
      const uri = `file://${path.join(tempDir, 'nonexistent.txt')}`;
      await expect(handler.read(uri)).rejects.toThrow();
    });

    it('should get handler info with list capability', () => {
      const info = handler.getHandlerInfo();
      expect(info.type).toBe('FileResourceHandler');
      expect(info.capabilities).toContain('read');
      expect(info.capabilities).toContain('list');
    });
  });

  describe('DatabaseResourceHandler', () => {
    let handler: DatabaseResourceHandler;

    beforeEach(() => {
      handler = new DatabaseResourceHandler(
        'db://test',
        'Database Handler',
        'postgresql://localhost:5432/test',
        'users'
      );
    });

    it('should read database content', async () => {
      const uri = 'db://test/users/1';
      const content = await handler.read(uri);
      
      expect(content.uri).toBe(uri);
      expect(content.mimeType).toBe('application/json');
      expect(content.content).toContain('Sample database content');
      expect(content.metadata?.table).toBe('users');
    });

    it('should list database resources', async () => {
      const resources = await handler.list?.();
      expect(resources).toBeDefined();
      expect(resources!.length).toBeGreaterThan(0);
      
      const resource = resources![0];
      expect(resource.uri).toContain('db://users');
      expect(resource.mimeType).toBe('application/json');
      expect(resource.permissions?.read).toBe(true);
    });

    it('should filter resources by pattern', async () => {
      const resources = await handler.list?.('Record');
      expect(resources).toBeDefined();
      expect(resources!.length).toBeGreaterThan(0);
      expect(resources![0].name).toContain('Record');
    });

    it('should get handler info with list capability', () => {
      const info = handler.getHandlerInfo();
      expect(info.type).toBe('DatabaseResourceHandler');
      expect(info.capabilities).toContain('read');
      expect(info.capabilities).toContain('list');
    });
  });

  describe('Error Handling', () => {
    let handler: MockResourceHandler;

    beforeEach(() => {
      handler = new MockResourceHandler('test://example', 'Test Resource');
    });

    it('should handle resource errors with proper classification', () => {
      const mockError = new Error('Test error');
      (mockError as any).code = 'ENOENT';

      try {
        (handler as any).handleResourceError(mockError, 'read', 'test://example');
      } catch (error: any) {
        expect(error.code).toBe(MCPErrorCode.RESOURCE_NOT_FOUND);
        expect(error.category).toBe('resource');
        expect(error.retryable).toBe(false);
      }
    });

    it('should handle access denied errors', () => {
      const mockError = new Error('Permission denied');
      (mockError as any).code = 'EACCES';

      try {
        (handler as any).handleResourceError(mockError, 'read', 'test://example');
      } catch (error: any) {
        expect(error.code).toBe(MCPErrorCode.RESOURCE_ACCESS_DENIED);
        expect(error.retryable).toBe(false);
      }
    });

    it('should handle resource exhaustion errors', () => {
      const mockError = new Error('Too many open files');
      (mockError as any).code = 'EMFILE';

      try {
        (handler as any).handleResourceError(mockError, 'read', 'test://example');
      } catch (error: any) {
        expect(error.code).toBe(MCPErrorCode.TOOL_RESOURCE_EXHAUSTED);
        expect(error.severity).toBe('high');
        expect(error.retryable).toBe(true);
      }
    });

    it('should handle timeout errors', () => {
      const mockError = new Error('Operation timed out');
      (mockError as any).code = 'ETIMEDOUT';

      try {
        (handler as any).handleResourceError(mockError, 'read', 'test://example');
      } catch (error: any) {
        expect(error.code).toBe(MCPErrorCode.TOOL_TIMEOUT);
        expect(error.retryable).toBe(true);
      }
    });

    it('should preserve existing MCP errors', () => {
      const originalError = new (require('../types/error').MCPErrorClass)(
        MCPErrorCode.RESOURCE_LOCKED,
        'Resource is locked'
      );

      try {
        (handler as any).handleResourceError(originalError, 'read', 'test://example');
      } catch (error: any) {
        expect(error).toBe(originalError);
        expect(error.code).toBe(MCPErrorCode.RESOURCE_LOCKED);
      }
    });
  });
});