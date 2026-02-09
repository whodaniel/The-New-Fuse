/**
 * Abstract base class for MCP Resource Handlers
 */

import { ResourceHandler as IResourceHandler, MCPResource, ResourceContent, ResourceCallback } from '../interfaces/IMCPResource';
import { MCPErrorClass, MCPErrorCode, ErrorCategory, ErrorSeverity } from '../types/error';

/**
 * Abstract base class for implementing resource handlers
 * Provides common functionality and enforces the resource handler contract
 */
export abstract class ResourceHandler implements IResourceHandler {
  protected readonly uri: string;
  protected readonly name: string;
  protected readonly mimeType?: string;
  protected readonly metadata?: Record<string, any>;

  constructor(
    uri: string,
    name: string,
    options: {
      mimeType?: string;
      metadata?: Record<string, any>;
    } = {}
  ) {
    this.uri = uri;
    this.name = name;
    this.mimeType = options.mimeType;
    this.metadata = options.metadata;
  }

  /**
   * Abstract method to read content from a resource
   * Must be implemented by concrete resource handlers
   */
  abstract read(uri: string, params?: any): Promise<ResourceContent>;

  /**
   * Optional method to list resources matching a pattern
   * Default implementation throws not implemented error
   */
  async list?(pattern?: string): Promise<MCPResource[]> {
    throw new MCPErrorClass(
      MCPErrorCode.RESOURCE_UNAVAILABLE,
      `List operation not supported for resource handler: ${this.constructor.name}`,
      {
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.LOW,
        retryable: false,
        details: { handlerType: this.constructor.name, pattern }
      }
    );
  }

  /**
   * Optional method to subscribe to resource changes
   * Default implementation throws not implemented error
   */
  async subscribe?(uri: string, callback: ResourceCallback): Promise<void> {
    throw new MCPErrorClass(
      MCPErrorCode.RESOURCE_UNAVAILABLE,
      `Subscribe operation not supported for resource handler: ${this.constructor.name}`,
      {
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.LOW,
        retryable: false,
        details: { handlerType: this.constructor.name, uri }
      }
    );
  }

  /**
   * Optional method to unsubscribe from resource changes
   * Default implementation throws not implemented error
   */
  async unsubscribe?(uri: string): Promise<void> {
    throw new MCPErrorClass(
      MCPErrorCode.RESOURCE_UNAVAILABLE,
      `Unsubscribe operation not supported for resource handler: ${this.constructor.name}`,
      {
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.LOW,
        retryable: false,
        details: { handlerType: this.constructor.name, uri }
      }
    );
  }

  /**
   * Validate resource URI format
   */
  protected validateUri(uri: string): void {
    if (!uri || typeof uri !== 'string') {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_INVALID_FORMAT,
        'Resource URI must be a non-empty string',
        {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { uri }
        }
      );
    }

    try {
      new URL(uri);
    } catch (error) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_INVALID_FORMAT,
        `Invalid URI format: ${uri}`,
        {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { uri, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );
    }
  }

  /**
   * Create resource content object with proper validation
   */
  protected createResourceContent(
    uri: string,
    content: string | Buffer,
    options: {
      mimeType?: string;
      metadata?: Record<string, any>;
      encoding?: string;
    } = {}
  ): ResourceContent {
    const size = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8');
    
    return {
      uri,
      mimeType: options.mimeType || this.mimeType || 'text/plain',
      content,
      size,
      lastModified: new Date(),
      encoding: options.encoding || 'utf8',
      metadata: {
        ...this.metadata,
        ...options.metadata
      }
    };
  }

  /**
   * Handle resource access errors with proper error classification
   */
  protected handleResourceError(error: any, operation: string, uri: string): never {
    if (error instanceof MCPErrorClass) {
      throw error;
    }

    let errorCode = MCPErrorCode.RESOURCE_UNAVAILABLE;
    let severity = ErrorSeverity.MEDIUM;

    // Classify common error types
    if (error.code === 'ENOENT' || error.code === 'ENOTFOUND') {
      errorCode = MCPErrorCode.RESOURCE_NOT_FOUND;
      severity = ErrorSeverity.LOW;
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = MCPErrorCode.RESOURCE_ACCESS_DENIED;
      severity = ErrorSeverity.MEDIUM;
    } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
      errorCode = MCPErrorCode.TOOL_RESOURCE_EXHAUSTED;
      severity = ErrorSeverity.HIGH;
    } else if (error.code === 'ETIMEDOUT') {
      errorCode = MCPErrorCode.TOOL_TIMEOUT;
      severity = ErrorSeverity.MEDIUM;
    }

    throw new MCPErrorClass(
      errorCode,
      `Resource ${operation} failed for URI ${uri}: ${error.message || 'Unknown error'}`,
      {
        category: ErrorCategory.RESOURCE,
        severity,
        retryable: errorCode !== MCPErrorCode.RESOURCE_NOT_FOUND && errorCode !== MCPErrorCode.RESOURCE_ACCESS_DENIED,
        details: {
          operation,
          uri,
          originalError: error.message,
          errorCode: error.code
        },
        cause: error
      }
    );
  }

  /**
   * Get handler information
   */
  getHandlerInfo(): {
    type: string;
    uri: string;
    name: string;
    mimeType?: string;
    capabilities: string[];
  } {
    const capabilities: string[] = ['read'];
    
    if (this.list) capabilities.push('list');
    if (this.subscribe) capabilities.push('subscribe');
    if (this.unsubscribe) capabilities.push('unsubscribe');

    return {
      type: this.constructor.name,
      uri: this.uri,
      name: this.name,
      mimeType: this.mimeType,
      capabilities
    };
  }
}

/**
 * File-based resource handler implementation
 */
export class FileResourceHandler extends ResourceHandler {
  private readonly basePath: string;

  constructor(
    uri: string,
    name: string,
    basePath: string,
    options: {
      mimeType?: string;
      metadata?: Record<string, any>;
    } = {}
  ) {
    super(uri, name, options);
    this.basePath = basePath;
  }

  async read(uri: string, params?: any): Promise<ResourceContent> {
    this.validateUri(uri);

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Extract file path from URI
      const url = new URL(uri);
      let relativePath = url.pathname;
      // Remove leading slash for relative path resolution
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.slice(1);
      }
      const filePath = path.resolve(this.basePath, relativePath);
      
      // Security check: ensure file is within base path
      if (!filePath.startsWith(this.basePath)) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_ACCESS_DENIED,
          'Access denied: file path outside allowed directory',
          {
            category: ErrorCategory.RESOURCE,
            severity: ErrorSeverity.HIGH,
            retryable: false,
            details: { uri, filePath, basePath: this.basePath }
          }
        );
      }

      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);
      
      return this.createResourceContent(uri, content, {
        mimeType: this.inferMimeType(filePath),
        metadata: {
          size: stats.size,
          lastModified: stats.mtime,
          created: stats.birthtime
        }
      });
    } catch (error) {
      this.handleResourceError(error, 'read', uri);
    }
  }

  async list(pattern?: string): Promise<MCPResource[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const files = await fs.readdir(this.basePath, { withFileTypes: true });
      const resources: MCPResource[] = [];

      for (const file of files) {
        if (file.isFile()) {
          const fileName = file.name;
          if (!pattern || fileName.includes(pattern)) {
            const filePath = path.join(this.basePath, fileName);
            const uri = `file://${filePath}`;
            
            resources.push({
              uri,
              name: fileName,
              description: `File resource: ${fileName}`,
              mimeType: this.inferMimeType(filePath),
              handler: this,
              permissions: {
                read: true,
                write: false,
                subscribe: false
              }
            });
          }
        }
      }

      return resources;
    } catch (error) {
      this.handleResourceError(error, 'list', this.basePath);
    }
  }

  private inferMimeType(filePath: string): string {
    const path = require('path');
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.xml': 'application/xml',
      '.md': 'text/markdown',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}

/**
 * Database-based resource handler implementation
 */
export class DatabaseResourceHandler extends ResourceHandler {
  private readonly connectionString: string;
  private readonly tableName: string;

  constructor(
    uri: string,
    name: string,
    connectionString: string,
    tableName: string,
    options: {
      mimeType?: string;
      metadata?: Record<string, any>;
    } = {}
  ) {
    super(uri, name, options);
    this.connectionString = connectionString;
    this.tableName = tableName;
  }

  async read(uri: string, params?: any): Promise<ResourceContent> {
    this.validateUri(uri);

    try {
      // This is a placeholder implementation
      // In a real implementation, you would connect to the database
      // and execute the appropriate query based on the URI and parameters
      
      const mockData = {
        id: 1,
        data: 'Sample database content',
        timestamp: new Date().toISOString()
      };

      return this.createResourceContent(uri, JSON.stringify(mockData, null, 2), {
        mimeType: 'application/json',
        metadata: {
          table: this.tableName,
          query: params?.query || 'SELECT * FROM ' + this.tableName
        }
      });
    } catch (error) {
      this.handleResourceError(error, 'read', uri);
    }
  }

  async list(pattern?: string): Promise<MCPResource[]> {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would query the database schema
      // to list available resources/tables
      
      const mockResources: MCPResource[] = [
        {
          uri: `db://${this.tableName}/1`,
          name: `${this.tableName} Record 1`,
          description: `Database record from table ${this.tableName}`,
          mimeType: 'application/json',
          handler: this,
          permissions: {
            read: true,
            write: false,
            subscribe: false
          }
        }
      ];

      return pattern 
        ? mockResources.filter(r => r.name.includes(pattern))
        : mockResources;
    } catch (error) {
      this.handleResourceError(error, 'list', this.connectionString);
    }
  }
}