/**
 * Event Subscription Manager
 *
 * Manages event subscriptions and pattern matching for selective routing
 * of notifications and events to interested services.
 */

import { EventEmitter } from 'events';
import { MCPErrorClass, MCPErrorCode } from '../types/error';

/**
 * Event subscription pattern types
 */
export enum PatternType {
  EXACT = 'exact',
  WILDCARD = 'wildcard',
  REGEX = 'regex',
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
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
  topMatchingPatterns: Array<{ pattern: string; matches: number }>;
}

/**
 * Event Subscription Manager class
 */
export class EventSubscriptionManager extends EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private serviceSubscriptions: Map<string, Set<string>> = new Map(); // serviceId -> subscription IDs
  private patternCache: Map<string, RegExp> = new Map();
  private isStarted: boolean = false;

  /**
   * Start the subscription manager
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    console.log('Event subscription manager started');
  }

  /**
   * Stop the subscription manager
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    // Clear all subscriptions and caches
    this.subscriptions.clear();
    this.serviceSubscriptions.clear();
    this.patternCache.clear();

    this.isStarted = false;
    console.log('Event subscription manager stopped');
  }

  /**
   * Subscribe a service to events matching a pattern
   */
  async subscribe(
    serviceId: string,
    pattern: string,
    patternType: PatternType = PatternType.EXACT,
    filters?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Event subscription manager is not started'
      );
    }

    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      serviceId,
      pattern,
      patternType,
      filters,
      metadata,
      createdAt: new Date(),
      matchCount: 0,
      active: true,
    };

    // Validate pattern based on type
    this.validatePattern(pattern, patternType);

    // Store subscription
    this.subscriptions.set(subscriptionId, subscription);

    // Update service subscription mapping
    if (!this.serviceSubscriptions.has(serviceId)) {
      this.serviceSubscriptions.set(serviceId, new Set());
    }
    this.serviceSubscriptions.get(serviceId)!.add(subscriptionId);

    // Pre-compile regex patterns for performance
    if (patternType === PatternType.REGEX || patternType === PatternType.WILDCARD) {
      try {
        const regexPattern =
          patternType === PatternType.WILDCARD ? this.wildcardToRegex(pattern) : pattern;
        this.patternCache.set(subscriptionId, new RegExp(regexPattern, 'i'));
      } catch {
        // Remove invalid subscription
        this.subscriptions.delete(subscriptionId);
        this.serviceSubscriptions.get(serviceId)!.delete(subscriptionId);
        throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, `Invalid regex pattern: ${pattern}`);
      }
    }

    this.emit('subscriptionCreated', subscription);
    console.log(`Service ${serviceId} subscribed to pattern: ${pattern} (${patternType})`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Event subscription manager is not started'
      );
    }

    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Subscription not found: ${subscriptionId}`
      );
    }

    // Remove from subscriptions
    this.subscriptions.delete(subscriptionId);

    // Remove from service mapping
    const serviceSubscriptions = this.serviceSubscriptions.get(subscription.serviceId);
    if (serviceSubscriptions) {
      serviceSubscriptions.delete(subscriptionId);
      if (serviceSubscriptions.size === 0) {
        this.serviceSubscriptions.delete(subscription.serviceId);
      }
    }

    // Remove from pattern cache
    this.patternCache.delete(subscriptionId);

    this.emit('subscriptionRemoved', subscription);
    console.log(`Unsubscribed: ${subscriptionId} for service ${subscription.serviceId}`);
  }

  /**
   * Unsubscribe all subscriptions for a service
   */
  async unsubscribeService(serviceId: string): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Event subscription manager is not started'
      );
    }

    const subscriptionIds = this.serviceSubscriptions.get(serviceId);
    if (!subscriptionIds) {
      return; // No subscriptions for this service
    }

    // Remove all subscriptions for this service
    for (const subscriptionId of Array.from(subscriptionIds)) {
      await this.unsubscribe(subscriptionId);
    }

    console.log(`Unsubscribed all subscriptions for service: ${serviceId}`);
  }

  /**
   * Find matching subscriptions for an event/notification
   */
  findMatchingSubscriptions(
    eventMethod: string,
    eventParams?: Record<string, any>
  ): EventMatchResult[] {
    if (!this.isStarted) {
      return [];
    }

    const results: EventMatchResult[] = [];

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) {
        continue;
      }

      const matchResult = this.matchSubscription(subscription, eventMethod, eventParams);
      if (matchResult.matches) {
        results.push(matchResult);

        // Update subscription match statistics
        subscription.matchCount++;
        subscription.lastMatch = new Date();
      }
    }

    // Sort by match score (if available) for better routing priority
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    return results;
  }

  /**
   * Get all subscriptions for a service
   */
  getServiceSubscriptions(serviceId: string): EventSubscription[] {
    const subscriptionIds = this.serviceSubscriptions.get(serviceId);
    if (!subscriptionIds) {
      return [];
    }

    return Array.from(subscriptionIds)
      .map((id) => this.subscriptions.get(id))
      .filter((sub) => sub !== undefined) as EventSubscription[];
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): EventSubscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.active);
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(subscriptionId: string, active: boolean): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Subscription not found: ${subscriptionId}`
      );
    }

    subscription.active = active;
    this.emit('subscriptionUpdated', subscription);
    console.log(`Subscription ${subscriptionId} set to ${active ? 'active' : 'inactive'}`);
  }

  /**
   * Get subscription statistics
   */
  getStatistics(): SubscriptionStats {
    const subscriptions = Array.from(this.subscriptions.values());
    const activeSubscriptions = subscriptions.filter((sub) => sub.active);

    const subscriptionsByService = subscriptions.reduce(
      (acc, sub) => {
        acc[sub.serviceId] = (acc[sub.serviceId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const subscriptionsByPattern = subscriptions.reduce(
      (acc, sub) => {
        acc[sub.patternType] = (acc[sub.patternType] || 0) + 1;
        return acc;
      },
      {} as Record<PatternType, number>
    );

    const totalMatches = subscriptions.reduce((sum, sub) => sum + sub.matchCount, 0);
    const averageMatchesPerSubscription =
      subscriptions.length > 0 ? totalMatches / subscriptions.length : 0;

    const topMatchingPatterns = subscriptions
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 10)
      .map((sub) => ({ pattern: sub.pattern, matches: sub.matchCount }));

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      subscriptionsByService,
      subscriptionsByPattern,
      totalMatches,
      averageMatchesPerSubscription,
      topMatchingPatterns,
    };
  }

  /**
   * Match a subscription against an event
   */
  private matchSubscription(
    subscription: EventSubscription,
    eventMethod: string,
    eventParams?: Record<string, any>
  ): EventMatchResult {
    const result: EventMatchResult = {
      subscription,
      matches: false,
      matchedFields: [],
      score: 0,
    };

    // Match against method name
    const methodMatches = this.matchPattern(
      eventMethod,
      subscription.pattern,
      subscription.patternType,
      subscription.id
    );

    if (!methodMatches) {
      return result;
    }

    result.matches = true;
    result.matchedFields = ['method'];
    result.score = 1;

    // Apply additional filters if specified
    if (subscription.filters && eventParams) {
      const filterResult = this.matchFilters(eventParams, subscription.filters);
      if (!filterResult.matches) {
        result.matches = false;
        return result;
      }

      result.matchedFields.push(...filterResult.matchedFields);
      result.score += filterResult.score;
    }

    return result;
  }

  /**
   * Match a value against a pattern
   */
  private matchPattern(
    value: string,
    pattern: string,
    patternType: PatternType,
    subscriptionId: string
  ): boolean {
    switch (patternType) {
      case PatternType.EXACT:
        return value === pattern;

      case PatternType.PREFIX:
        return value.startsWith(pattern);

      case PatternType.SUFFIX:
        return value.endsWith(pattern);

      case PatternType.WILDCARD:
      case PatternType.REGEX: {
        const regex = this.patternCache.get(subscriptionId);
        return regex ? regex.test(value) : false;
      }

      default:
        return false;
    }
  }

  /**
   * Match event parameters against subscription filters
   */
  private matchFilters(
    params: Record<string, any>,
    filters: Record<string, any>
  ): { matches: boolean; matchedFields: string[]; score: number } {
    const matchedFields: string[] = [];
    let score = 0;

    for (const [key, expectedValue] of Object.entries(filters)) {
      const actualValue = params[key];

      if (actualValue === undefined) {
        return { matches: false, matchedFields: [], score: 0 };
      }

      // Support different filter types
      if (this.matchFilterValue(actualValue, expectedValue)) {
        matchedFields.push(key);
        score += 0.5;
      } else {
        return { matches: false, matchedFields: [], score: 0 };
      }
    }

    return { matches: true, matchedFields, score };
  }

  /**
   * Match a single filter value
   */
  private matchFilterValue(actual: any, expected: any): boolean {
    if (expected === actual) {
      return true;
    }

    // Support array contains
    if (Array.isArray(expected) && expected.includes(actual)) {
      return true;
    }

    // Support regex matching for strings
    if (typeof expected === 'object' && expected.regex && typeof actual === 'string') {
      return new RegExp(expected.regex, expected.flags || 'i').test(actual);
    }

    // Support range matching for numbers
    if (typeof expected === 'object' && expected.min !== undefined && expected.max !== undefined) {
      return actual >= expected.min && actual <= expected.max;
    }

    return false;
  }

  /**
   * Convert wildcard pattern to regex
   */
  private wildcardToRegex(pattern: string): string {
    return pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except * and ?
      .replace(/\*/g, '.*') // * matches any sequence
      .replace(/\?/g, '.'); // ? matches any single character
  }

  /**
   * Validate pattern based on type
   */
  private validatePattern(pattern: string, patternType: PatternType): void {
    if (!pattern) {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Pattern cannot be empty');
    }

    switch (patternType) {
      case PatternType.REGEX:
        try {
          new RegExp(pattern);
        } catch {
          throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, `Invalid regex pattern: ${pattern}`);
        }
        break;

      case PatternType.WILDCARD:
        // Validate wildcard pattern (basic check)
        if (pattern.includes('**')) {
          throw new MCPErrorClass(
            MCPErrorCode.INVALID_PARAMS,
            'Double wildcards (**) are not supported'
          );
        }
        break;

      // Other pattern types don't need special validation
      default:
        break;
    }
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
