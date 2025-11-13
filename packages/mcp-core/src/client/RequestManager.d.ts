/**
 * Request Manager for MCP Client
 *
 * Handles request/response lifecycle, timeout management, and request queuing
 * for MCP client operations.
 */
import { EventEmitter } from 'events';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage';
import { MCPConnection } from '../interfaces/IMCPConnection';
import { RetryPolicy } from '../types/common';
/**
 * Request Manager implementation
 */
export declare class RequestManager extends EventEmitter {
    private defaultTimeout;
    private retryPolicy;
    private maxQueueSize;
    private pendingRequests;
    private requestQueue;
    private connection;
    private isProcessingQueue;
    private requestIdCounter;
    constructor(defaultTimeout?: number, retryPolicy?: RetryPolicy, maxQueueSize?: number);
    /**
     * Set the active connection
     */
    setConnection(connection: MCPConnection | null): void;
    /**
     * Send a request and return a promise for the response
     */
    sendRequest(request: MCPRequest, timeout?: number): Promise<MCPResponse>;
    /**
     * Send a notification (fire-and-forget)
     */
    sendNotification(notification: MCPNotification): Promise<void>;
    /**
     * Execute a request with retry logic
     */
    private executeRequest;
    /**
     * Handle incoming messages
     */
    private handleMessage;
    /**
     * Handle connection disconnection
     */
    private handleDisconnection;
    /**
     * Process queued requests
     */
    private processQueue;
    /**
     * Generate a unique request ID
     */
    private generateRequestId;
    /**
     * Get pending request count
     */
    getPendingRequestCount(): number;
    /**
     * Get queued request count
     */
    getQueuedRequestCount(): number;
    /**
     * Clear the request queue
     */
    clearQueue(): void;
    /**
     * Cancel a pending request
     */
    cancelRequest(requestId: string | number): boolean;
    /**
     * Get request statistics
     */
    getStatistics(): {
        pendingRequests: number;
        queuedRequests: number;
        totalRequestsSent: number;
        isProcessingQueue: boolean;
        connectionActive: boolean;
    };
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
//# sourceMappingURL=RequestManager.d.ts.map