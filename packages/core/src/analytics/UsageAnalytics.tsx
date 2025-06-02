import { Injectable } from '@nestjs/common';
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

@Injectable()
export class UsageAnalytics {
  private events: UsageEvent[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private logger: Logger;

  constructor(
    private readonly eventBus: EventBusService,
    logger: Logger
  ) {
    this.logger = logger.createChild('UsageAnalytics');
  }

  async trackEvent(
    eventType: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const event: UsageEvent = {
      eventType,
      userId,
      timestamp: Date.now(),
      metadata,
    };
    this.events.push(event);

    const session = this.sessions.get(userId);
    if (session) {
      session.events.push(event);
    }

    this.logger.debug('Usage event tracked', { eventType, userId });
  }

  async startSession(userId: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      sessionId,
      userId,
      startTime: Date.now(),
      events: []
    };

    this.sessions.set(userId, session); // Store session by userId for easy lookup
    await this.eventBus.publish('usage.session.start', session);

    this.logger.info('User session started', { userId, sessionId });
    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = Array.from(this.sessions.values()).find(s => s.sessionId === sessionId);
    if (!session) {
      this.logger.warn('Session not found', { sessionId });
      return;
    }

    session.endTime = Date.now();
    await this.eventBus.publish('usage.session.end', session);

    this.logger.info('User session ended', {
      userId: session.userId,
      sessionId,
      duration: session.endTime - session.startTime
    });
  }

  async getSessionMetrics(
    sessionId: string
  ): Promise<{
    duration: number;
    eventCount: number;
    eventsByType: Record<string, number>;
  } | undefined> {
    const session = Array.from(this.sessions.values()).find(s => s.sessionId === sessionId);
    if (!session) {
      this.logger.warn('Session not found', { sessionId });
      return undefined;
    }

    const duration = (session.endTime || Date.now()) - session.startTime;
    const eventsByType = this.countEventsByType(session.events);

    return {
      duration,
      eventCount: session.events.length,
      eventsByType
    };
  }


  async getUserMetrics(
    userId: string,
    timeWindow?: number
  ): Promise<{
    totalSessions: number;
    averageSessionDuration: number;
    totalEvents: number;
    eventsByType: Record<string, number>;
  }> {
    const userSessions = Array.from(this.sessions.values()).filter(session => session.userId === userId);

    let relevantSessions = userSessions;
    if (timeWindow) {
      const cutoffTime = Date.now() - timeWindow;
      relevantSessions = userSessions.filter(session => session.startTime >= cutoffTime);
    }

    const sessionDurations = relevantSessions
      .filter(session => session.endTime)
      .map(session => session.endTime! - session.startTime);

    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b) / sessionDurations.length
      : 0;

    const userEvents = relevantSessions.flatMap(session => session.events);
    const eventsByType = this.countEventsByType(userEvents);

    return {
      totalSessions: relevantSessions.length,
      averageSessionDuration,
      totalEvents: userEvents.length,
      eventsByType
    };
  }

  async getOverallMetrics(
    timeWindow?: number
  ): Promise<UsageMetrics> {
    let relevantEvents = this.events;
    let relevantSessions = Array.from(this.sessions.values());

    if (timeWindow) {
      const cutoffTime = Date.now() - timeWindow;
      relevantEvents = this.events.filter(event => event.timestamp >= cutoffTime);
      relevantSessions = relevantSessions.filter(session => session.startTime >= cutoffTime);
    }

    const uniqueUsers = new Set(relevantEvents.map(event => event.userId));
    const activeSessions = relevantSessions.filter(session => !session.endTime);

    const sessionDurations = relevantSessions
      .filter(session => session.endTime)
      .map(session => session.endTime! - session.startTime);

    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b) / sessionDurations.length
      : 0;

    return {
      totalUsers: uniqueUsers.size,
      activeUsers: activeSessions.length,
      averageSessionDuration,
      totalEvents: relevantEvents.length,
      eventsByType: this.countEventsByType(relevantEvents)
    };
  }

  private countEventsByType(events: UsageEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  async generateUsageReport(
    timeWindow: number
  ): Promise<{
    metrics: UsageMetrics;
    topUsers: Array<{ userId: string; eventCount: number }>;
    popularFeatures: Array<{ feature: string; useCount: number }>;
  }> {
    const metrics = await this.getOverallMetrics(timeWindow);

    const cutoffTime = Date.now() - timeWindow;
    const relevantEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    // Calculate top users
    const userEventCounts = relevantEvents.reduce((acc, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userEventCounts)
      .map(([userId, count]) => ({ userId, eventCount: count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Calculate popular features (assuming feature is in metadata)
    const featureCounts = relevantEvents.reduce((acc, event) => {
      if ((event as any).metadata.feature) { // Use any for now due to unknown metadata structure
        acc[(event as any).metadata.feature] = (acc[(event as any).metadata.feature] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const popularFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, useCount: count }))
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 10);

    return {
      metrics,
      topUsers,
      popularFeatures
    };
  }

  async cleanup(retentionPeriod: number): Promise<void> {
    const cutoffTime = Date.now() - retentionPeriod;

    // Clean up events
    this.events = this.events.filter(event => event.timestamp > cutoffTime);

    // Clean up sessions
    for (const [userId, session] of this.sessions.entries()) {
      if (session.endTime && session.endTime < cutoffTime) {
        this.sessions.delete(userId);
      } else {
        // Clean up events within active sessions
        session.events = session.events.filter(event => event.timestamp > cutoffTime);
      }
    }

    this.logger.info('Usage data cleaned up', {
      eventsCount: this.events.length,
      sessionsCount: this.sessions.size
    });
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
