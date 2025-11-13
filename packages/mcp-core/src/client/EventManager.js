/**
 * Event Manager for MCP Client
 *
 * Handles event subscription, notification routing, and event-driven
 * communication patterns for MCP clients.
 */
import { EventEmitter } from 'events';
/**
 * Event Manager implementation
 */
export class EventManager extends EventEmitter {
    subscriptions = new Map();
    statistics = {
        totalNotifications: 0,
        notificationsByMethod: new Map(),
        subscriptionCount: 0
    };
    subscriptionIdCounter = 0;
    /**
     * Subscribe to notifications matching a pattern
     */
    subscribe(pattern, callback, options = {}) {
        const subscriptionId = this.generateSubscriptionId();
        const subscription = {
            id: subscriptionId,
            pattern,
            callback,
            once: options.once || false,
            timestamp: new Date()
        };
        this.subscriptions.set(subscriptionId, subscription);
        this.statistics.subscriptionCount = this.subscriptions.size;
        this.emit('subscriptionAdded', subscriptionId, pattern);
        return subscriptionId;
    }
    /**
     * Subscribe to a specific notification method
     */
    subscribeToMethod(method, callback) {
        return this.subscribe(method, callback);
    }
    /**
     * Subscribe to notifications matching a regex pattern
     */
    subscribeToPattern(pattern, callback) {
        return this.subscribe(pattern, callback);
    }
    /**
     * Subscribe to all notifications
     */
    subscribeToAll(callback) {
        return this.subscribe(/.*/, callback);
    }
    /**
     * Subscribe to a notification once
     */
    subscribeOnce(pattern, callback) {
        return this.subscribe(pattern, callback, { once: true });
    }
    /**
     * Unsubscribe from notifications
     */
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            this.subscriptions.delete(subscriptionId);
            this.statistics.subscriptionCount = this.subscriptions.size;
            this.emit('subscriptionRemoved', subscriptionId);
            return true;
        }
        return false;
    }
    /**
     * Unsubscribe all subscriptions for a pattern
     */
    unsubscribePattern(pattern) {
        let removedCount = 0;
        const patternStr = pattern.toString();
        for (const [id, subscription] of this.subscriptions) {
            if (subscription.pattern.toString() === patternStr) {
                this.subscriptions.delete(id);
                removedCount++;
            }
        }
        this.statistics.subscriptionCount = this.subscriptions.size;
        this.emit('patternUnsubscribed', pattern, removedCount);
        return removedCount;
    }
    /**
     * Clear all subscriptions
     */
    clearAllSubscriptions() {
        const count = this.subscriptions.size;
        this.subscriptions.clear();
        this.statistics.subscriptionCount = 0;
        this.emit('allSubscriptionsCleared', count);
    }
    /**
     * Handle incoming notification
     */
    handleNotification(notification) {
        this.statistics.totalNotifications++;
        this.statistics.lastNotificationTime = new Date();
        // Update method statistics
        const methodCount = this.statistics.notificationsByMethod.get(notification.method) || 0;
        this.statistics.notificationsByMethod.set(notification.method, methodCount + 1);
        // Find matching subscriptions
        const matchingSubscriptions = [];
        for (const subscription of this.subscriptions.values()) {
            if (this.matchesPattern(notification.method, subscription.pattern)) {
                matchingSubscriptions.push(subscription);
            }
        }
        // Execute callbacks
        const subscriptionsToRemove = [];
        for (const subscription of matchingSubscriptions) {
            try {
                subscription.callback(notification);
                this.emit('notificationDelivered', subscription.id, notification.method);
                // Remove one-time subscriptions
                if (subscription.once) {
                    subscriptionsToRemove.push(subscription.id);
                }
            }
            catch (error) {
                this.emit('callbackError', subscription.id, error, notification);
            }
        }
        // Clean up one-time subscriptions
        for (const id of subscriptionsToRemove) {
            this.unsubscribe(id);
        }
        // Emit general notification event
        this.emit('notification', notification);
    }
    /**
     * Check if a method matches a pattern
     */
    matchesPattern(method, pattern) {
        if (typeof pattern === 'string') {
            // Exact match or wildcard
            if (pattern === method)
                return true;
            if (pattern === '*')
                return true;
            // Simple glob-style matching
            if (pattern.includes('*')) {
                const regexPattern = pattern
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.');
                return new RegExp(`^${regexPattern}$`).test(method);
            }
            return false;
        }
        else {
            // RegExp pattern
            return pattern.test(method);
        }
    }
    /**
     * Generate a unique subscription ID
     */
    generateSubscriptionId() {
        return `sub_${Date.now()}_${++this.subscriptionIdCounter}`;
    }
    /**
     * Get active subscriptions
     */
    getSubscriptions() {
        return Array.from(this.subscriptions.values());
    }
    /**
     * Get subscriptions for a specific pattern
     */
    getSubscriptionsForPattern(pattern) {
        const patternStr = pattern.toString();
        return Array.from(this.subscriptions.values())
            .filter(sub => sub.pattern.toString() === patternStr);
    }
    /**
     * Get event statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            notificationsByMethod: new Map(this.statistics.notificationsByMethod)
        };
    }
    /**
     * Get subscription count
     */
    getSubscriptionCount() {
        return this.subscriptions.size;
    }
    /**
     * Check if there are subscriptions for a method
     */
    hasSubscriptionsForMethod(method) {
        for (const subscription of this.subscriptions.values()) {
            if (this.matchesPattern(method, subscription.pattern)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Get methods with active subscriptions
     */
    getSubscribedMethods() {
        const methods = new Set();
        for (const subscription of this.subscriptions.values()) {
            if (typeof subscription.pattern === 'string' && !subscription.pattern.includes('*')) {
                methods.add(subscription.pattern);
            }
        }
        return Array.from(methods);
    }
    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = {
            totalNotifications: 0,
            notificationsByMethod: new Map(),
            subscriptionCount: this.subscriptions.size
        };
    }
    /**
     * Create a promise that resolves when a specific notification is received
     */
    waitForNotification(pattern, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.unsubscribe(subscriptionId);
                reject(new Error(`Timeout waiting for notification matching pattern: ${pattern}`));
            }, timeout);
            const subscriptionId = this.subscribeOnce(pattern, (notification) => {
                clearTimeout(timeoutHandle);
                resolve(notification);
            });
        });
    }
    /**
     * Create a filtered event stream
     */
    createFilteredStream(pattern) {
        const stream = new EventEmitter();
        const subscriptionId = this.subscribe(pattern, (notification) => {
            stream.emit('notification', notification);
        });
        // Add cleanup method to the stream
        stream.cleanup = () => {
            this.unsubscribe(subscriptionId);
            stream.removeAllListeners();
        };
        return stream;
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearAllSubscriptions();
        this.resetStatistics();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=EventManager.js.map