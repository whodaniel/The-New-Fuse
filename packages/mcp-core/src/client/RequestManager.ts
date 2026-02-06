/**
 * Request Manager for MCP Client
 *
 * Handles request/response lifecycle, timeout management, and request queuing
 * for MCP client operations.
 */

import { EventEmitter } from 'events';
import { MCPConnection } from '../interfaces/IMCPConnection';
import { MCPNotification, MCPRequest, MCPResponse } from '../interfaces/IMCPMessage';
import { RetryPolicy } from '../types/common';
import { MCPErrorClass, MCPErrorCode } from '../types/error';

/**
 * Pending request information
 */
interface PendingRequest {
  id: string | number;
  request: MCPRequest;
  resolve: (response: MCPResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  timestamp: Date;
  retryCount: number;
}

/**
 * Request queue item
 */
interface QueuedRequest {
  request: MCPRequest;
  resolve: (response: MCPResponse) => void;
  reject: (error: Error) => void;
  timestamp: Date;
  priority: number;
}

/**
 * Request Manager implementation
 */
export class RequestManager extends EventEmitter {
  private pendingRequests = new Map<string | number, PendingRequest>();
  private requestQueue: QueuedRequest[] = [];
  private connection: MCPConnection | null = null;
  private isProcessingQueue = false;
  private requestIdCounter = 0;

  constructor(
    private defaultTimeout: number = 30000,
    private retryPolicy: RetryPolicy = { maxAttempts: 3, baseDelay: 1000, maxDelay: 10000 },
    private maxQueueSize: number = 1000
  ) {
    super();
  }

  /**
   * Set the active connection
   */
  setConnection(connection: MCPConnection | null): void {
    if (this.connection) {
      this.connection.removeAllListeners('message');
    }

    this.connection = connection;

    if (connection) {
      connection.on('message', (message: any) => {
        this.handleMessage(message);
      });

      connection.on('disconnected', () => {
        this.handleDisconnection();
      });

      // Process queued requests when connection is established
      this.processQueue();
    }
  }

  /**
   * Send a request and return a promise for the response
   */
  async sendRequest(request: MCPRequest, timeout?: number): Promise<MCPResponse> {
    // Generate ID if not provided
    if (!request.id) {
      request.id = this.generateRequestId();
    }

    return new Promise<MCPResponse>((resolve, reject) => {
      // Check if connection is available
      if (!this.connection || !this.connection.isActive()) {
        // Queue the request if connection is not available
        if (this.requestQueue.length >= this.maxQueueSize) {
          reject(new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Request queue is full'));
          return;
        }

        this.requestQueue.push({
          request,
          resolve,
          reject,
          timestamp: new Date(),
          priority: 0,
        });

        this.emit('requestQueued', request.id);
        return;
      }

      this.executeRequest(request, resolve, reject, timeout || this.defaultTimeout, 0);
    });
  }

  /**
   * Send a notification (fire-and-forget)
   */
  async sendNotification(notification: MCPNotification): Promise<void> {
    if (!this.connection || !this.connection.isActive()) {
      throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Connection not available');
    }

    await this.connection.send(notification);
    this.emit('notificationSent', notification);
  }

  /**
   * Execute a request with retry logic
   */
  private async executeRequest(
    request: MCPRequest,
    resolve: (response: MCPResponse) => void,
    reject: (error: Error) => void,
    timeout: number,
    retryCount: number
  ): Promise<void> {
    try {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(request.id!);

        if (retryCount < this.retryPolicy.maxAttempts) {
          // Retry with exponential backoff
          const delay = Math.min(
            this.retryPolicy.baseDelay * Math.pow(2, retryCount),
            this.retryPolicy.maxDelay
          );

          setTimeout(() => {
            this.executeRequest(request, resolve, reject, timeout, retryCount + 1);
          }, delay);
        } else {
          reject(
            new MCPErrorClass(
              MCPErrorCode.TIMEOUT,
              `Request timeout after ${retryCount + 1} attempts`
            )
          );
        }
      }, timeout);

      // Store pending request
      this.pendingRequests.set(request.id!, {
        id: request.id!,
        request,
        resolve,
        reject,
        timeout: timeoutHandle,
        timestamp: new Date(),
        retryCount,
      });

      // Send the request
      await this.connection!.send(request);
      this.emit('requestSent', request.id, retryCount);
    } catch (error) {
      // Clean up pending request
      const pending = this.pendingRequests.get(request.id!);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(request.id!);
      }

      if (retryCount < this.retryPolicy.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.min(
          this.retryPolicy.baseDelay * Math.pow(2, retryCount),
          this.retryPolicy.maxDelay
        );

        setTimeout(() => {
          this.executeRequest(request, resolve, reject, timeout, retryCount + 1);
        }, delay);
      } else {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    // Handle responses
    if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          const error = new MCPErrorClass(
            message.error.code || MCPErrorCode.INTERNAL_ERROR,
            message.error.message || 'Unknown error',
            message.error.data
          );
          pending.reject(error);
          this.emit('requestFailed', message.id, error);
        } else {
          pending.resolve(message as MCPResponse);
          this.emit('requestCompleted', message.id);
        }
      }
    }
    // Handle notifications
    else if (message.method && message.id === undefined) {
      this.emit('notification', message as MCPNotification);
    }
  }

  /**
   * Handle connection disconnection
   */
  private handleDisconnection(): void {
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Connection lost'));
    }
    this.pendingRequests.clear();

    this.emit('connectionLost');
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.connection || !this.connection.isActive()) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Sort queue by priority and timestamp
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp.getTime() - b.timestamp.getTime(); // Older first
      });

      // Process requests one by one
      while (this.requestQueue.length > 0 && this.connection && this.connection.isActive()) {
        const queuedRequest = this.requestQueue.shift()!;

        try {
          this.executeRequest(
            queuedRequest.request,
            queuedRequest.resolve,
            queuedRequest.reject,
            this.defaultTimeout,
            0
          );

          this.emit('requestDequeued', queuedRequest.request.id);

          // Small delay to prevent overwhelming the connection
          await new Promise((resolve) => setTimeout(resolve, 10));
        } catch (error) {
          queuedRequest.reject(error as Error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Get pending request count
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get queued request count
   */
  getQueuedRequestCount(): number {
    return this.requestQueue.length;
  }

  /**
   * Clear the request queue
   */
  clearQueue(): void {
    // Reject all queued requests
    for (const queuedRequest of this.requestQueue) {
      queuedRequest.reject(new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Queue cleared'));
    }
    this.requestQueue = [];
  }

  /**
   * Cancel a pending request
   */
  cancelRequest(requestId: string | number): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);
      pending.reject(new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'Request cancelled'));
      this.emit('requestCancelled', requestId);
      return true;
    }
    return false;
  }

  /**
   * Get request statistics
   */
  getStatistics() {
    return {
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.length,
      totalRequestsSent: this.requestIdCounter,
      isProcessingQueue: this.isProcessingQueue,
      connectionActive: this.connection?.isActive() || false,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Client shutting down'));
    }
    this.pendingRequests.clear();

    // Clear queue
    this.clearQueue();

    // Remove connection listeners
    if (this.connection) {
      this.connection.removeAllListeners('message');
      this.connection.removeAllListeners('disconnected');
    }

    this.removeAllListeners();
  }
}
