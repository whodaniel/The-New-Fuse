// Analytics Service
// Track user events and usage patterns (privacy-focused, no PII)

class AnalyticsService {
  constructor() {
    this.enabled = true;
    this.events = [];
    this.maxEvents = 1000;
  }

  // Track an event
  async track(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      name: eventName,
      properties: properties,
      timestamp: Date.now(),
      sessionId: await this.getSessionId(),
    };

    // Store locally
    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Save to storage
    await chrome.storage.local.set({
      analyticsEvents: this.events,
    });

    // Log for development
    console.log('📊 Analytics:', eventName, properties);

    return event;
  }

  // Get or create session ID
  async getSessionId() {
    let { sessionId, sessionStart } = await chrome.storage.local.get(['sessionId', 'sessionStart']);

    // Create new session if none exists or if it's been more than 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    if (!sessionId || !sessionStart || Date.now() - sessionStart > thirtyMinutes) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStart = Date.now();

      await chrome.storage.local.set({
        sessionId,
        sessionStart,
      });
    }

    return sessionId;
  }

  // Get all events
  async getEvents(limit = 100) {
    const { analyticsEvents = [] } = await chrome.storage.local.get('analyticsEvents');
    return analyticsEvents.slice(-limit);
  }

  // Get events by name
  async getEventsByName(eventName, limit = 100) {
    const events = await this.getEvents(this.maxEvents);
    return events.filter((e) => e.name === eventName).slice(-limit);
  }

  // Get usage stats
  async getUsageStats() {
    const events = await this.getEvents(this.maxEvents);

    const stats = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map((e) => e.sessionId)).size,
      eventCounts: {},
      firstEvent: events[0]?.timestamp,
      lastEvent: events[events.length - 1]?.timestamp,
    };

    // Count events by name
    events.forEach((event) => {
      stats.eventCounts[event.name] = (stats.eventCounts[event.name] || 0) + 1;
    });

    return stats;
  }

  // Clear all events
  async clearEvents() {
    this.events = [];
    await chrome.storage.local.remove('analyticsEvents');
  }

  // Enable/disable analytics
  async setEnabled(enabled) {
    this.enabled = enabled;
    await chrome.storage.local.set({ analyticsEnabled: enabled });
  }

  // Check if enabled
  async isEnabled() {
    const { analyticsEnabled = true } = await chrome.storage.local.get('analyticsEnabled');
    this.enabled = analyticsEnabled;
    return analyticsEnabled;
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
