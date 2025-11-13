/**
 * MCP Client Implementation
 *
 * Main MCP client class that provides a complete implementation of the IMCPClient
 * interface with connection management, request handling, and resource access.
 */
import { EventEmitter } from 'events';
import { IMCPClient } from '../interfaces/IMCPClient';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage';
import { MCPResource, ResourceContent } from '../interfaces/IMCPResource';
import { MCPCapability } from '../interfaces/IMCPCapability';
import { ToolResult } from '../interfaces/IMCPTool';
import { ConnectionOptions } from '../interfaces/IMCPConnection';
import { MCPClientConfig, ClientStatistics, ClientStatus } from '../types/client';
import { NotificationCallback } from '../types/common';
/**
 * MCP Client implementation
 */
export declare class MCPClient extends EventEmitter implements IMCPClient {
    private config;
    private connectionManager;
    private requestManager;
    private eventManager;
    private cache;
    private currentEndpoint;
    private isInitialized;
    private startTime;
    private statistics;
    constructor(config: MCPClientConfig);
    /**
     * Setup internal event handlers
     */
    private setupEventHandlers;
    /**
     * Connect to an MCP server endpoint
     */
    connect(endpoint: string, options?: ConnectionOptions): Promise<void>;
    /**
     * Disconnect from the MCP server
     */
    disconnect(): Promise<void>;
    /**
     * Send a request to the connected MCP server
     */
    sendRequest(request: MCPRequest): Promise<MCPResponse>;
    /**
     * Subscribe to notifications from the MCP server
     */
    subscribeToNotifications(callback: NotificationCallback): void;
    /**
     * List available resources from the MCP server
     */
    listResources(pattern?: string): Promise<MCPResource[]>;
    /**
     * Read content from a specific resource
     */
    readResource(uri: string): Promise<ResourceContent>;
    /**
     * Call a tool on the MCP server
     */
    callTool(name: string, params: any): Promise<ToolResult>;
    /**
     * Get server capabilities
     */
    getServerCapabilities(): Promise<MCPCapability[]>;
    /**
     * Check if the client is currently connected
     */
    isConnected(): boolean;
    /**
     * Get the current connection endpoint
     */
    getEndpoint(): string | null;
    /**
     * Send a notification to the server (fire-and-forget)
     */
    sendNotification(notification: MCPNotification): Promise<void>;
    /**
     * Subscribe to specific notification methods
     */
    subscribeToMethod(method: string, callback: NotificationCallback): string;
    /**
     * Subscribe to notifications matching a pattern
     */
    subscribeToPattern(pattern: RegExp, callback: NotificationCallback): string;
    /**
     * Unsubscribe from notifications
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Wait for a specific notification
     */
    waitForNotification(pattern: string | RegExp, timeout?: number): Promise<MCPNotification>;
    /**
     * Get client statistics
     */
    getStatistics(): ClientStatistics;
    /**
     * Get client status
     */
    getStatus(): ClientStatus;
    /**
     * Get cache statistics
     */
    getCacheStatistics(): import("./ClientCache").CacheStatistics;
    /**
     * Clear client cache
     */
    clearCache(): void;
    /**
     * Ping the server
     */
    ping(): Promise<number>;
    /**
     * Generate a unique request ID
     */
    private generateRequestId;
    /**
     * Update average response time
     */
    private updateAverageResponseTime;
    /**
     * Cleanup and shutdown the client
     */
    cleanup(): Promise<void>;
    /**
     * Reconnect to the current endpoint
     */
    reconnect(): Promise<void>;
    /**
     * Enable automatic reconnection
     */
    enableAutoReconnect(): void;
}
//# sourceMappingURL=MCPClient.d.ts.map