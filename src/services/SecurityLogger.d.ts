import { EventBus } from '../core/events/event-bus.js';
export declare enum SecurityEventType {
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
declare class SecurityLogger {
  constructor(
    logger: LoggingService,
    cache: CacheService,
    time: TimeService,
    eventBus: EventBus,
    config: ConfigService,
  );
  private logger;
  private cache;
  private time;
  private eventBus;
  private config;
  logEvent(event: Omit<SecurityEvent, "timestamp">): Promise<void>;
  private cacheEvent;
  private getEventCacheKey;
  private handleCriticalEvent;
  private updateThreatAssessment;
  private updateMetrics;
  getRecentEvents(
    filter: {
      userId?: string;
      ip?: string;
      source?: string;
      severity?: SecurityEvent["severity"];
      type?: string;
    },
    limit?: number,
  ): Promise<SecurityEvent[]>;
  private getFilterCacheKey;
  private matchesFilter;
}
export { SecurityLogger };
