interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
}

interface UsageStats {
  totalEvents: number;
  uniqueSessions: number;
  eventCounts: Record<string, number>;
  firstEvent: number | undefined;
  lastEvent: number | undefined;
}

class AnalyticsService {
  private enabled: boolean = true;
  private events: AnalyticsEvent[] = [];
  private maxEvents: number = 1000;

  async track(eventName: string, properties: Record<string, unknown> = {}): Promise<AnalyticsEvent> {
    if (!this.enabled) return { name: eventName, properties, timestamp: Date.now(), sessionId: '' };

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: await this.getSessionId(),
    };

    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    await chrome.storage.local.set({ analyticsEvents: this.events });

    console.log('Analytics:', eventName, properties);

    return event;
  }

  async getSessionId(): Promise<string> {
    const data = await chrome.storage.local.get(['sessionId', 'sessionStart']);
    let { sessionId, sessionStart } = data as { sessionId?: string; sessionStart?: number };

    const thirtyMinutes = 30 * 60 * 1000;
    if (!sessionId || !sessionStart || Date.now() - sessionStart > thirtyMinutes) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStart = Date.now();

      await chrome.storage.local.set({ sessionId, sessionStart });
    }

    return sessionId;
  }

  async getEvents(limit = 100): Promise<AnalyticsEvent[]> {
    const { analyticsEvents = [] } = (await chrome.storage.local.get('analyticsEvents')) as {
      analyticsEvents?: AnalyticsEvent[];
    };
    return analyticsEvents.slice(-limit);
  }

  async getEventsByName(eventName: string, limit = 100): Promise<AnalyticsEvent[]> {
    const events = await this.getEvents(this.maxEvents);
    return events.filter((e) => e.name === eventName).slice(-limit);
  }

  async getUsageStats(): Promise<UsageStats> {
    const events = await this.getEvents(this.maxEvents);

    const stats: UsageStats = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map((e) => e.sessionId)).size,
      eventCounts: {},
      firstEvent: events[0]?.timestamp,
      lastEvent: events[events.length - 1]?.timestamp,
    };

    events.forEach((event) => {
      stats.eventCounts[event.name] = (stats.eventCounts[event.name] || 0) + 1;
    });

    return stats;
  }

  async clearEvents(): Promise<void> {
    this.events = [];
    await chrome.storage.local.remove('analyticsEvents');
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await chrome.storage.local.set({ analyticsEnabled: enabled });
  }

  async isEnabled(): Promise<boolean> {
    const { analyticsEnabled = true } = (await chrome.storage.local.get('analyticsEnabled')) as {
      analyticsEnabled?: boolean;
    };
    this.enabled = analyticsEnabled;
    return analyticsEnabled;
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
