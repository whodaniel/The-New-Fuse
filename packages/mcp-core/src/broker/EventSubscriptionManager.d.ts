/**
 * Event Subscription Manager
 *
 * Manages event subscriptions and pattern matching for selective routing
 * of notifications and events to interested services.
 */
import { EventEmitter } from 'events';
/**
 * Event subscription pattern types
 */
export declare enum PatternType {
    EXACT = "exact",
    WILDCARD = "wildcard",
    REGEX = "regex",
    PREFIX = "prefix",
    SUFFIX = "suffix"
}
/**
 * Event subscription configuration
 */
export interface EventSubscription {
    id: string;
    serviceId: string;
    pattern: string;
    patternType: PatternType;
    filters?: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: Date;
    lastMatch?: Date;
    matchCount: number;
    active: boolean;
}
/**
 * Event matching result
 */
export interface EventMatchResult {
    subscription: EventSubscription;
    matches: boolean;
    matchedFields?: string[];
    score?: number;
}
/**
 * Event subscription statistics
 */
export interface SubscriptionStats {
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionsByService: Record<string, number>;
    subscriptionsByPattern: Record<PatternType, number>;
    totalMatches: number;
    averageMatchesPerSubscription: number;
    topMatchingPatterns: Array<{
        pattern: string;
        matches: number;
    }>;
}
/**
 * Event Subscription Manager class
 */
export declare class EventSubscriptionManager extends EventEmitter {
    private subscriptions;
    private serviceSubscriptions;
    private patternCache;
    private isStarted;
    /**
     * Start the subscription manager
     */
    start(): Promise<void>;
    /**
     * Stop the subscription manager
     */
    stop(): Promise<void>;
    /**
     * Subscribe a service to events matching a pattern
     */
    subscribe(serviceId: string, pattern: string, patternType?: PatternType, filters?: Record<string, any>, metadata?: Record<string, any>): Promise<string>;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): Promise<void>;
    /**
     * Unsubscribe all subscriptions for a service
     */
    unsubscribeService(serviceId: string): Promise<void>;
    /**
     * Find matching subscriptions for an event/notification
     */
    findMatchingSubscriptions(eventMethod: string, eventParams?: Record<string, any>): EventMatchResult[];
    /**
     * Get all subscriptions for a service
     */
    getServiceSubscriptions(serviceId: string): EventSubscription[];
    /**
     * Get subscription by ID
     */
    getSubscription(subscriptionId: string): EventSubscription | null;
    /**
     * Get all active subscriptions
     */
    getActiveSubscriptions(): EventSubscription[];
    /**
     * Update subscription status
     */
    updateSubscriptionStatus(subscriptionId: string, active: boolean): Promise<void>;
    /**
     * Get subscription statistics
     */
    getStatistics(): SubscriptionStats;
    /**
     * Match a subscription against an event
     */
    private matchSubscription;
    /**
     * Match a value against a pattern
     */
    private matchPattern;
    /**
     * Match event parameters against subscription filters
     */
    private matchFilters;
    /**
     * Match a single filter value
     */
    private matchFilterValue;
    /**
     * Convert wildcard pattern to regex
     */
    private wildcardToRegex;
    /**
     * Validate pattern based on type
     */
    private validatePattern;
    /**
     * Generate unique subscription ID
     */
    private generateSubscriptionId;
}
//# sourceMappingURL=EventSubscriptionManager.d.ts.map