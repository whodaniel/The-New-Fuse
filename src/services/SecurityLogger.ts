import { injectable, inject } from "inversify";
import type { TYPES } from '.../core/di/types.js';
import { LoggingService } from '../core/logging/logging.service.js';
import { CacheService } from '../core/cache/cache.service.js';
import { TimeService } from '../core/utils/time.service.js';
import { EventBus } from '../core/events/event-bus.js';
import { ConfigService } from '../core/config/config.service.js';

export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_COMPLETE = "PASSWORD_RESET_COMPLETE",
  MFA_SETUP = "MFA_SETUP",
  MFA_VERIFICATION = "MFA_VERIFICATION",
  MFA_DISABLED = "MFA_DISABLED",
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  DEVICE_ADDED = "DEVICE_ADDED",
  DEVICE_REMOVED = "DEVICE_REMOVED",
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
}

export interface SecurityEvent {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  details: Record<string, any>;
  timestamp: Date;
  userId?: string;
  ip?: string;
}

@injectable()
class SecurityLogger {
  private logger: LoggingService;
  private cache: CacheService;
  private time: TimeService;
  private eventBus: EventBus;
  private config: ConfigService;

  constructor(
    @inject(TYPES.Logger) logger: LoggingService,
    @inject(TYPES.Cache) cache: CacheService,
    @inject(TYPES.Time) time: TimeService,
    @inject(TYPES.EventBus) eventBus: EventBus,
    @inject(TYPES.Config) config: ConfigService,
  ) {
    this.logger = logger;
    this.cache = cache;
    this.time = time;
    this.eventBus = eventBus;
    this.config = config;
  }

  public async logEvent(
    event: Omit<SecurityEvent, "timestamp">,
  ): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Log the event
    this.logger.info("Security event logged", { event: fullEvent });

    // Cache recent events for quick access
    await this.cacheEvent(fullEvent);

    // Publish metrics
    this.publishEventMetrics(fullEvent);

    // Handle high severity events specially
    if (event.severity === "high" || event.severity === "critical") {
      await this.handleCriticalEvent(fullEvent);
    }
  }

  private async cacheEvent(event: SecurityEvent): Promise<void> {
    const key = this.getEventCacheKey(event);
    const recentEvents = this.cache.get<SecurityEvent[]>(key) || [];

    recentEvents.push(event);

    // Keep only recent events based on configuration
    const retentionPeriod = this.config.get(
      "security.eventRetentionHours",
      24,
    );
    const cutoffTime = this.time.subtract(new Date(), {
      hours: retentionPeriod,
      days: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });

    const filteredEvents = recentEvents.filter(
      (e) => e.timestamp > cutoffTime,
    );

    this.cache.set(key, filteredEvents, {
      ttl: retentionPeriod * 60 * 60 * 1000, // Convert hours to milliseconds
    });
  }

  private getEventCacheKey(event: SecurityEvent): string {
    if (event.userId) {
      return `security:events:user:${event.userId}`;
    }
    if (event.ip) {
      return `security:events:ip:${event.ip}`;
    }
    return `security:events:${event.source}`;
  }

  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    // Log critical event with high visibility
    this.logger.error("Security event error", { event });

    // Check for pattern of critical events
    const oneHourAgo = this.time.subtract(new Date(), {
      hours: 1,
      days: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });

    const criticalEventsLastHour = this.getRecentEvents({
      source: event.source,
      severity: "critical",
    }, 100).filter(
      (e) =>
        e.severity === "critical" && e.timestamp > oneHourAgo,
    ).length;

    // If too many critical events, trigger additional security measures
    if (
      criticalEventsLastHour >=
      this.config.get("security.criticalEventThreshold", 5)
    ) {
      this.eventBus.publish("security.threat", {
        source: event.source,
        level: "high",
        events: criticalEventsLastHour,
        details: event.details,
      });
    }
  }

  private publishEventMetrics(event: SecurityEvent): void {
    // Update event counters
    this.eventBus.publish("metrics.increment", {
      metric: "security_events_total",
      tags: {
        type: event.type,
        severity: event.severity,
        source: event.source,
      },
    });

    // Update severity-specific metrics
    if (["high", "critical"].includes(event.severity)) {
      this.eventBus.publish("metrics.increment", {
        metric: "security_high_severity_events",
        tags: {
          type: event.type,
          source: event.source,
        },
      });
    }
  }

  private isFilterObject(filter: unknown): filter is Record<string, any> {
    return typeof filter === 'object' && filter !== null;
  }

  public getRecentEvents(
    filter: {
      userId?: string;
      ip?: string;
      source?: string;
      severity?: SecurityEvent["severity"];
      type?: string;
    },
    limit: number = 100,
  ): SecurityEvent[] {
    // Assuming getFilterCacheKey is robust enough or filter is pre-validated
    // For this example, let's trust the filter structure for getFilterCacheKey
    const key = this.getFilterCacheKey(filter as Record<string, any>);
    const events = this.cache.get<SecurityEvent[]>(key) || [];

    return events
      .filter((event) => this.matchesFilter(event, filter as Record<string, any>))
      .sort(
        (a, b) =>
          b.timestamp.getTime() - a.timestamp.getTime(),
      )
      .slice(0, limit);
  }

  private getFilterCacheKey(filter: Record<string, any>): string {
    if (filter && filter.userId) return `security:events:user:${filter.userId}`;
    if (filter && filter.ip) return `security:events:ip:${filter.ip}`;
    if (filter && filter.source) return `security:events:${filter.source}`;
    return "security:events:all";
  }

  private matchesFilter(event: SecurityEvent, filter: Record<string, any>): boolean {
    if (!this.isFilterObject(filter)) return true; // Or false, depending on desired behavior for invalid filter

    return (
      (!filter.severity || event.severity === filter.severity) &&
      (!filter.type || event.type === filter.type) &&
      (!filter.source || event.source === filter.source) &&
      (!filter.userId || event.userId === filter.userId) &&
      (!filter.ip || event.ip === filter.ip)
    );
  }
}

// Export the class instead of instantiating it directly
export { SecurityLogger };
