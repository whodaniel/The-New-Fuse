/**
 * Abstract base class for MCP Resource Handlers
 */
import { ResourceHandler as IResourceHandler, MCPResource, ResourceContent, ResourceCallback } from '../interfaces/IMCPResource';
/**
 * Abstract base class for implementing resource handlers
 * Provides common functionality and enforces the resource handler contract
 */
export declare abstract class ResourceHandler implements IResourceHandler {
    protected readonly uri: string;
    protected readonly name: string;
    protected readonly mimeType?: string;
    protected readonly metadata?: Record<string, any>;
    constructor(uri: string, name: string, options?: {
        mimeType?: string;
        metadata?: Record<string, any>;
    });
    /**
     * Abstract method to read content from a resource
     * Must be implemented by concrete resource handlers
     */
    abstract read(uri: string, params?: any): Promise<ResourceContent>;
    /**
     * Optional method to list resources matching a pattern
     * Default implementation throws not implemented error
     */
    list?(pattern?: string): Promise<MCPResource[]>;
    /**
     * Optional method to subscribe to resource changes
     * Default implementation throws not implemented error
     */
    subscribe?(uri: string, callback: ResourceCallback): Promise<void>;
    /**
     * Optional method to unsubscribe from resource changes
     * Default implementation throws not implemented error
     */
    unsubscribe?(uri: string): Promise<void>;
    /**
     * Validate resource URI format
     */
    protected validateUri(uri: string): void;
    /**
     * Create resource content object with proper validation
     */
    protected createResourceContent(uri: string, content: string | Buffer, options?: {
        mimeType?: string;
        metadata?: Record<string, any>;
        encoding?: string;
    }): ResourceContent;
    /**
     * Handle resource access errors with proper error classification
     */
    protected handleResourceError(error: any, operation: string, uri: string): never;
    /**
     * Get handler information
     */
    getHandlerInfo(): {
        type: string;
        uri: string;
        name: string;
        mimeType?: string;
        capabilities: string[];
    };
}
/**
 * File-based resource handler implementation
 */
export declare class FileResourceHandler extends ResourceHandler {
    private readonly basePath;
    constructor(uri: string, name: string, basePath: string, options?: {
        mimeType?: string;
        metadata?: Record<string, any>;
    });
    read(uri: string, params?: any): Promise<ResourceContent>;
    list(pattern?: string): Promise<MCPResource[]>;
    private inferMimeType;
}
/**
 * Database-based resource handler implementation
 */
export declare class DatabaseResourceHandler extends ResourceHandler {
    private readonly connectionString;
    private readonly tableName;
    constructor(uri: string, name: string, connectionString: string, tableName: string, options?: {
        mimeType?: string;
        metadata?: Record<string, any>;
    });
    read(uri: string, params?: any): Promise<ResourceContent>;
    list(pattern?: string): Promise<MCPResource[]>;
}
//# sourceMappingURL=ResourceHandler.d.ts.map