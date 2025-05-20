import { Logger } from '../logging/LoggingService.js';
import { EventBusService } from '../integration/EventBusService.js';
export interface UsageEvent {
    eventType: string;
    userId: string;
    timestamp: number;
    duration?: number;
    metadata: Record<string, unknown>;
}
export interface UserSession {
    sessionId: string;
    userId: string;
    startTime: number;
    endTime?: number;
    events: UsageEvent[];
}
export interface UsageMetrics {
    totalUsers: number;
    activeUsers: number;
    averageSessionDuration: number;
    totalEvents: number;
    eventsByType: Record<string, number>;
}
export declare class UsageAnalytics {
    private readonly eventBus;
    private events;
    private sessions;
    Logger: any;
    constructor(eventBus: EventBusService, logger: Logger);
    endSession(): Promise<void>;
}
