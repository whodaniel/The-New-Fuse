/**
 * Event Manager for MCP Client
 *
 * Handles event subscription, notification routing, and event-driven
 * communication patterns for MCP clients.
 */

import { EventEmitter } from 'events';
import { MCPNotification } from '../interfaces/IMCPMessage';
import { NotificationCallback } from '../types/common';

/**
 * Event subscription information
 */
interface EventSubscription {
  id: string;
  pattern: string | RegExp;
  callback: NotificationCallback;
  once: boolean;
  timestamp: Date;
}

/**
 * Event statistics
 */
interface EventStatistics {
  totalNotifications: number;
  notificationsByMethod: Map<string, number>;
  subscriptionCount: number;
  lastNotificationTime?: Date;
}

/**
 * Event Manager implementation
 */
export class EventManager extends EventEmitter {
  private subscriptions = new Map<string, EventSubscription>();
  private statistics: EventStatistics = {
    totalNotifications: 0,
    notificationsByMethod: new Map(),
    subscriptionCount: 0,
  };
  private subscriptionIdCounter = 0;

  /**
   * Subscribe to notifications matching a pattern
   */
  subscribe(
    pattern: string | RegExp,
    callback: NotificationCallback,
    options: { once?: boolean } = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: EventSubscription = {
      id: subscriptionId,
      pattern,
      callback,
      once: options.once || false,
      timestamp: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.statistics.subscriptionCount = this.subscriptions.size;

    this.emit('subscriptionAdded', subscriptionId, pattern);
    return subscriptionId;
  }

  /**
   * Subscribe to a specific notification method
   */
  subscribeToMethod(method: string, callback: NotificationCallback): string {
    return this.subscribe(method, callback);
  }

  /**
   * Subscribe to notifications matching a regex pattern
   */
  subscribeToPattern(pattern: RegExp, callback: NotificationCallback): string {
    return this.subscribe(pattern, callback);
  }

  /**
   * Subscribe to all notifications
   */
  subscribeToAll(callback: NotificationCallback): string {
    return this.subscribe(/.*/, callback);
  }

  /**
   * Subscribe to a notification once
   */
  subscribeOnce(pattern: string | RegExp, callback: NotificationCallback): string {
    return this.subscribe(pattern, callback, { once: true });
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(subscriptionId: string): boolean {
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
  unsubscribePattern(pattern: string | RegExp): number {
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
  clearAllSubscriptions(): void {
    const count = this.subscriptions.size;
    this.subscriptions.clear();
    this.statistics.subscriptionCount = 0;
    this.emit('allSubscriptionsCleared', count);
  }

  /**
   * Handle incoming notification
   */
  handleNotification(notification: MCPNotification): void {
    this.statistics.totalNotifications++;
    this.statistics.lastNotificationTime = new Date();

    // Update method statistics
    const methodCount = this.statistics.notificationsByMethod.get(notification.method) || 0;
    this.statistics.notificationsByMethod.set(notification.method, methodCount + 1);

    // Find matching subscriptions
    const matchingSubscriptions: EventSubscription[] = [];

    for (const subscription of this.subscriptions.values()) {
      if (this.matchesPattern(notification.method, subscription.pattern)) {
        matchingSubscriptions.push(subscription);
      }
    }

    // Execute callbacks
    const subscriptionsToRemove: string[] = [];

    for (const subscription of matchingSubscriptions) {
      try {
        subscription.callback(notification);
        this.emit('notificationDelivered', subscription.id, notification.method);

        // Remove one-time subscriptions
        if (subscription.once) {
          subscriptionsToRemove.push(subscription.id);
        }
      } catch (error) {
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
  private matchesPattern(method: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      // Exact match or wildcard
      if (pattern === method) return true;
      if (pattern === '*') return true;

      // Simple glob-style matching
      if (pattern.includes('*')) {
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(`^${regexPattern}$`).test(method);
      }

      return false;
    } else {
      // RegExp pattern
      return pattern.test(method);
    }
  }

  /**
   * Generate a unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${++this.subscriptionIdCounter}`;
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscriptions for a specific pattern
   */
  getSubscriptionsForPattern(pattern: string | RegExp): EventSubscription[] {
    const patternStr = pattern.toString();
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.pattern.toString() === patternStr
    );
  }

  /**
   * Get event statistics
   */
  getStatistics(): EventStatistics {
    return {
      ...this.statistics,
      notificationsByMethod: new Map(this.statistics.notificationsByMethod),
    };
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if there are subscriptions for a method
   */
  hasSubscriptionsForMethod(method: string): boolean {
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
  getSubscribedMethods(): string[] {
    const methods = new Set<string>();

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
  resetStatistics(): void {
    this.statistics = {
      totalNotifications: 0,
      notificationsByMethod: new Map(),
      subscriptionCount: this.subscriptions.size,
    };
  }

  /**
   * Create a promise that resolves when a specific notification is received
   */
  waitForNotification(pattern: string | RegExp, timeout: number = 30000): Promise<MCPNotification> {
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
  createFilteredStream(pattern: string | RegExp): EventEmitter {
    const stream = new EventEmitter();

    const subscriptionId = this.subscribe(pattern, (notification) => {
      stream.emit('notification', notification);
    });

    // Add cleanup method to the stream
    (stream as any).cleanup = () => {
      this.unsubscribe(subscriptionId);
      stream.removeAllListeners();
    };

    return stream;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearAllSubscriptions();
    this.resetStatistics();
    this.removeAllListeners();
  }
}
