/**
 * Message Queue Implementation
 *
 * Handles queuing of messages for offline services and retry handling
 * with persistence and delivery guarantees.
 */
import { EventEmitter } from 'events';
import { MCPErrorClass, MCPErrorCode } from '../types/error';
/**
 * Queued message types
 */
export var QueuedMessageType;
(function (QueuedMessageType) {
    QueuedMessageType["REQUEST"] = "request";
    QueuedMessageType["NOTIFICATION"] = "notification";
})(QueuedMessageType || (QueuedMessageType = {}));
/**
 * Message Queue class for handling offline service messages
 */
export class MessageQueue extends EventEmitter {
    queue = new Map();
    processingQueue = new Set();
    serviceQueues = new Map(); // serviceId -> message IDs
    config;
    cleanupTimer;
    isStarted = false;
    constructor(config = {}) {
        super();
        this.config = {
            maxSize: 10000,
            defaultPriority: 5,
            defaultMaxRetries: 3,
            retryDelayMs: 1000,
            maxRetryDelayMs: 30000,
            backoffMultiplier: 2,
            messageTimeoutMs: 300000, // 5 minutes
            cleanupIntervalMs: 60000, // 1 minute
            ...config
        };
    }
    /**
     * Start the message queue
     */
    async start() {
        if (this.isStarted) {
            return;
        }
        // Start cleanup timer
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredMessages();
        }, this.config.cleanupIntervalMs);
        this.isStarted = true;
        console.log('Message queue started');
    }
    /**
     * Stop the message queue
     */
    async stop() {
        if (!this.isStarted) {
            return;
        }
        // Clear cleanup timer
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        // Clear all queues
        this.queue.clear();
        this.processingQueue.clear();
        this.serviceQueues.clear();
        this.isStarted = false;
        console.log('Message queue stopped');
    }
    /**
     * Enqueue a message for a service
     */
    async enqueueMessage(targetService, message, options = {}) {
        if (!this.isStarted) {
            throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Message queue is not started');
        }
        // Check queue size limit
        if (this.queue.size >= this.config.maxSize) {
            throw new MCPErrorClass(MCPErrorCode.TOOL_RESOURCE_EXHAUSTED, 'Message queue is full');
        }
        const messageId = this.generateMessageId();
        const now = new Date();
        const timeoutMs = options.timeoutMs || this.config.messageTimeoutMs;
        const queuedMessage = {
            id: messageId,
            type: 'method' in message ? QueuedMessageType.REQUEST : QueuedMessageType.NOTIFICATION,
            targetService,
            message,
            priority: options.priority || this.config.defaultPriority,
            maxRetries: options.maxRetries || this.config.defaultMaxRetries,
            currentRetries: 0,
            createdAt: now,
            nextAttempt: now,
            expiresAt: new Date(now.getTime() + timeoutMs),
            metadata: options.metadata
        };
        // Add to queue
        this.queue.set(messageId, queuedMessage);
        // Add to service queue mapping
        if (!this.serviceQueues.has(targetService)) {
            this.serviceQueues.set(targetService, new Set());
        }
        this.serviceQueues.get(targetService).add(messageId);
        this.emit('messageEnqueued', queuedMessage);
        console.log(`Message ${messageId} enqueued for service ${targetService}`);
        return messageId;
    }
    /**
     * Dequeue messages for a service (when service comes online)
     */
    async dequeueMessagesForService(serviceId) {
        if (!this.isStarted) {
            return [];
        }
        const serviceMessageIds = this.serviceQueues.get(serviceId);
        if (!serviceMessageIds || serviceMessageIds.size === 0) {
            return [];
        }
        const messages = [];
        const now = new Date();
        for (const messageId of Array.from(serviceMessageIds)) {
            const message = this.queue.get(messageId);
            if (!message) {
                continue;
            }
            // Skip if message is expired
            if (message.expiresAt && message.expiresAt < now) {
                continue;
            }
            // Skip if message is not ready for retry
            if (message.nextAttempt > now) {
                continue;
            }
            // Skip if message is currently being processed
            if (this.processingQueue.has(messageId)) {
                continue;
            }
            messages.push(message);
        }
        // Sort by priority (higher priority first) and creation time
        messages.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
        return messages;
    }
    /**
     * Mark message as processing
     */
    async markMessageProcessing(messageId) {
        const message = this.queue.get(messageId);
        if (!message) {
            throw new MCPErrorClass(MCPErrorCode.RESOURCE_NOT_FOUND, `Message not found: ${messageId}`);
        }
        this.processingQueue.add(messageId);
        message.lastAttempt = new Date();
        message.currentRetries++;
        this.emit('messageProcessing', message);
    }
    /**
     * Mark message as successfully processed
     */
    async markMessageCompleted(messageId) {
        const message = this.queue.get(messageId);
        if (!message) {
            return; // Message might have been cleaned up
        }
        // Remove from all queues
        this.queue.delete(messageId);
        this.processingQueue.delete(messageId);
        const serviceQueue = this.serviceQueues.get(message.targetService);
        if (serviceQueue) {
            serviceQueue.delete(messageId);
            if (serviceQueue.size === 0) {
                this.serviceQueues.delete(message.targetService);
            }
        }
        this.emit('messageCompleted', message);
        console.log(`Message ${messageId} completed successfully`);
    }
    /**
     * Mark message as failed and schedule retry if applicable
     */
    async markMessageFailed(messageId, error) {
        const message = this.queue.get(messageId);
        if (!message) {
            return; // Message might have been cleaned up
        }
        this.processingQueue.delete(messageId);
        // Check if we should retry
        if (message.currentRetries < message.maxRetries) {
            // Schedule retry with exponential backoff
            const delay = Math.min(this.config.retryDelayMs * Math.pow(this.config.backoffMultiplier, message.currentRetries - 1), this.config.maxRetryDelayMs);
            message.nextAttempt = new Date(Date.now() + delay);
            this.emit('messageRetryScheduled', message, error);
            console.log(`Message ${messageId} failed, retry scheduled in ${delay}ms`);
        }
        else {
            // Max retries reached, remove from queue
            this.queue.delete(messageId);
            const serviceQueue = this.serviceQueues.get(message.targetService);
            if (serviceQueue) {
                serviceQueue.delete(messageId);
                if (serviceQueue.size === 0) {
                    this.serviceQueues.delete(message.targetService);
                }
            }
            this.emit('messageFailed', message, error);
            console.log(`Message ${messageId} failed permanently after ${message.currentRetries} attempts`);
        }
    }
    /**
     * Get messages for a specific service
     */
    getMessagesForService(serviceId) {
        const serviceMessageIds = this.serviceQueues.get(serviceId);
        if (!serviceMessageIds) {
            return [];
        }
        return Array.from(serviceMessageIds)
            .map(id => this.queue.get(id))
            .filter(msg => msg !== undefined);
    }
    /**
     * Get message by ID
     */
    getMessage(messageId) {
        return this.queue.get(messageId) || null;
    }
    /**
     * Remove message from queue
     */
    async removeMessage(messageId) {
        const message = this.queue.get(messageId);
        if (!message) {
            return false;
        }
        // Remove from all queues
        this.queue.delete(messageId);
        this.processingQueue.delete(messageId);
        const serviceQueue = this.serviceQueues.get(message.targetService);
        if (serviceQueue) {
            serviceQueue.delete(messageId);
            if (serviceQueue.size === 0) {
                this.serviceQueues.delete(message.targetService);
            }
        }
        this.emit('messageRemoved', message);
        return true;
    }
    /**
     * Clear all messages for a service
     */
    async clearServiceMessages(serviceId) {
        const serviceMessageIds = this.serviceQueues.get(serviceId);
        if (!serviceMessageIds) {
            return 0;
        }
        const count = serviceMessageIds.size;
        for (const messageId of Array.from(serviceMessageIds)) {
            await this.removeMessage(messageId);
        }
        return count;
    }
    /**
     * Get queue statistics
     */
    getStatistics() {
        const messages = Array.from(this.queue.values());
        const now = new Date();
        const pendingMessages = messages.filter(msg => !this.processingQueue.has(msg.id) &&
            msg.nextAttempt <= now &&
            (!msg.expiresAt || msg.expiresAt > now)).length;
        const processingMessages = this.processingQueue.size;
        const failedMessages = messages.filter(msg => msg.currentRetries >= msg.maxRetries).length;
        const expiredMessages = messages.filter(msg => msg.expiresAt && msg.expiresAt < now).length;
        const messagesByService = messages.reduce((acc, msg) => {
            acc[msg.targetService] = (acc[msg.targetService] || 0) + 1;
            return acc;
        }, {});
        const messagesByType = messages.reduce((acc, msg) => {
            acc[msg.type] = (acc[msg.type] || 0) + 1;
            return acc;
        }, {});
        const waitTimes = messages
            .filter(msg => msg.lastAttempt)
            .map(msg => msg.lastAttempt.getTime() - msg.createdAt.getTime());
        const averageWaitTime = waitTimes.length > 0
            ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
            : 0;
        const oldestMessage = messages.length > 0
            ? messages.reduce((oldest, msg) => msg.createdAt < oldest.createdAt ? msg : oldest).createdAt
            : undefined;
        return {
            totalMessages: messages.length,
            pendingMessages,
            processingMessages,
            failedMessages,
            expiredMessages,
            messagesByService,
            messagesByType,
            averageWaitTime,
            oldestMessage
        };
    }
    /**
     * Clean up expired messages
     */
    cleanupExpiredMessages() {
        const now = new Date();
        const expiredMessages = [];
        for (const [messageId, message] of this.queue.entries()) {
            if (message.expiresAt && message.expiresAt < now) {
                expiredMessages.push(messageId);
            }
        }
        for (const messageId of expiredMessages) {
            this.removeMessage(messageId);
        }
        if (expiredMessages.length > 0) {
            console.log(`Cleaned up ${expiredMessages.length} expired messages`);
        }
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=MessageQueue.js.map