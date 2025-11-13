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
export declare class EventManager extends EventEmitter {
    private subscriptions;
    private statistics;
    private subscriptionIdCounter;
    /**
     * Subscribe to notifications matching a pattern
     */
    subscribe(pattern: string | RegExp, callback: NotificationCallback, options?: {
        once?: boolean;
    }): string;
    /**
     * Subscribe to a specific notification method
     */
    subscribeToMethod(method: string, callback: NotificationCallback): string;
    /**
     * Subscribe to notifications matching a regex pattern
     */
    subscribeToPattern(pattern: RegExp, callback: NotificationCallback): string;
    /**
     * Subscribe to all notifications
     */
    subscribeToAll(callback: NotificationCallback): string;
    /**
     * Subscribe to a notification once
     */
    subscribeOnce(pattern: string | RegExp, callback: NotificationCallback): string;
    /**
     * Unsubscribe from notifications
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Unsubscribe all subscriptions for a pattern
     */
    unsubscribePattern(pattern: string | RegExp): number;
    /**
     * Clear all subscriptions
     */
    clearAllSubscriptions(): void;
    /**
     * Handle incoming notification
     */
    handleNotification(notification: MCPNotification): void;
    /**
     * Check if a method matches a pattern
     */
    private matchesPattern;
    /**
     * Generate a unique subscription ID
     */
    private generateSubscriptionId;
    /**
     * Get active subscriptions
     */
    getSubscriptions(): EventSubscription[];
    /**
     * Get subscriptions for a specific pattern
     */
    getSubscriptionsForPattern(pattern: string | RegExp): EventSubscription[];
    /**
     * Get event statistics
     */
    getStatistics(): EventStatistics;
    /**
     * Get subscription count
     */
    getSubscriptionCount(): number;
    /**
     * Check if there are subscriptions for a method
     */
    hasSubscriptionsForMethod(method: string): boolean;
    /**
     * Get methods with active subscriptions
     */
    getSubscribedMethods(): string[];
    /**
     * Reset statistics
     */
    resetStatistics(): void;
    /**
     * Create a promise that resolves when a specific notification is received
     */
    waitForNotification(pattern: string | RegExp, timeout?: number): Promise<MCPNotification>;
    /**
     * Create a filtered event stream
     */
    createFilteredStream(pattern: string | RegExp): EventEmitter;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export {};
//# sourceMappingURL=EventManager.d.ts.map