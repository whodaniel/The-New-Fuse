/**
 * Request Manager for MCP Client
 *
 * Handles request/response lifecycle, timeout management, and request queuing
 * for MCP client operations.
 */
import { EventEmitter } from 'events';
import { MCPErrorClass, MCPErrorCode } from '../types/error';
/**
 * Request Manager implementation
 */
export class RequestManager extends EventEmitter {
    defaultTimeout;
    retryPolicy;
    maxQueueSize;
    pendingRequests = new Map();
    requestQueue = [];
    connection = null;
    isProcessingQueue = false;
    requestIdCounter = 0;
    constructor(defaultTimeout = 30000, retryPolicy = { maxAttempts: 3, baseDelay: 1000, maxDelay: 10000 }, maxQueueSize = 1000) {
        super();
        this.defaultTimeout = defaultTimeout;
        this.retryPolicy = retryPolicy;
        this.maxQueueSize = maxQueueSize;
    }
    /**
     * Set the active connection
     */
    setConnection(connection) {
        if (this.connection) {
            this.connection.removeAllListeners('message');
        }
        this.connection = connection;
        if (connection) {
            connection.on('message', (message) => {
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
    async sendRequest(request, timeout) {
        // Generate ID if not provided
        if (!request.id) {
            request.id = this.generateRequestId();
        }
        return new Promise((resolve, reject) => {
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
                    priority: 0
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
    async sendNotification(notification) {
        if (!this.connection || !this.connection.isActive()) {
            throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Connection not available');
        }
        await this.connection.send(notification);
        this.emit('notificationSent', notification);
    }
    /**
     * Execute a request with retry logic
     */
    async executeRequest(request, resolve, reject, timeout, retryCount) {
        try {
            // Set up timeout
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(request.id);
                if (retryCount < this.retryPolicy.maxAttempts) {
                    // Retry with exponential backoff
                    const delay = Math.min(this.retryPolicy.baseDelay * Math.pow(2, retryCount), this.retryPolicy.maxDelay);
                    setTimeout(() => {
                        this.executeRequest(request, resolve, reject, timeout, retryCount + 1);
                    }, delay);
                }
                else {
                    reject(new MCPErrorClass(MCPErrorCode.TIMEOUT, `Request timeout after ${retryCount + 1} attempts`));
                }
            }, timeout);
            // Store pending request
            this.pendingRequests.set(request.id, {
                id: request.id,
                request,
                resolve,
                reject,
                timeout: timeoutHandle,
                timestamp: new Date(),
                retryCount
            });
            // Send the request
            await this.connection.send(request);
            this.emit('requestSent', request.id, retryCount);
        }
        catch (error) {
            // Clean up pending request
            const pending = this.pendingRequests.get(request.id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(request.id);
            }
            if (retryCount < this.retryPolicy.maxAttempts) {
                // Retry with exponential backoff
                const delay = Math.min(this.retryPolicy.baseDelay * Math.pow(2, retryCount), this.retryPolicy.maxDelay);
                setTimeout(() => {
                    this.executeRequest(request, resolve, reject, timeout, retryCount + 1);
                }, delay);
            }
            else {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        }
    }
    /**
     * Handle incoming messages
     */
    handleMessage(message) {
        // Handle responses
        if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(message.id);
                if (message.error) {
                    const error = new MCPErrorClass(message.error.code || MCPErrorCode.INTERNAL_ERROR, message.error.message || 'Unknown error', message.error.data);
                    pending.reject(error);
                    this.emit('requestFailed', message.id, error);
                }
                else {
                    pending.resolve(message);
                    this.emit('requestCompleted', message.id);
                }
            }
        }
        // Handle notifications
        else if (message.method && message.id === undefined) {
            this.emit('notification', message);
        }
    }
    /**
     * Handle connection disconnection
     */
    handleDisconnection() {
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
    async processQueue() {
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
                const queuedRequest = this.requestQueue.shift();
                try {
                    this.executeRequest(queuedRequest.request, queuedRequest.resolve, queuedRequest.reject, this.defaultTimeout, 0);
                    this.emit('requestDequeued', queuedRequest.request.id);
                    // Small delay to prevent overwhelming the connection
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                catch (error) {
                    queuedRequest.reject(error);
                }
            }
        }
        finally {
            this.isProcessingQueue = false;
        }
    }
    /**
     * Generate a unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${++this.requestIdCounter}`;
    }
    /**
     * Get pending request count
     */
    getPendingRequestCount() {
        return this.pendingRequests.size;
    }
    /**
     * Get queued request count
     */
    getQueuedRequestCount() {
        return this.requestQueue.length;
    }
    /**
     * Clear the request queue
     */
    clearQueue() {
        // Reject all queued requests
        for (const queuedRequest of this.requestQueue) {
            queuedRequest.reject(new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Queue cleared'));
        }
        this.requestQueue = [];
    }
    /**
     * Cancel a pending request
     */
    cancelRequest(requestId) {
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
            connectionActive: this.connection?.isActive() || false
        };
    }
    /**
     * Cleanup resources
     */
    cleanup() {
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
//# sourceMappingURL=RequestManager.js.map