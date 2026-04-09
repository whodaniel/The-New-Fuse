/**
 * TNF Extension Message Inspector
 * Advanced monitoring and analysis of extension message communication
 * Features: Real-time monitoring, pattern matching, performance analytics
 */

class ExtensionMessageInspector {
  constructor() {
    this.messageQueue = [];
    this.listeners = new Map();
    this.patterns = new Map();
    this.alerts = new Map();
    this.isActive = false;
    this.performanceMetrics = {
      totalMessages: 0,
      averageProcessingTime: 0,
      peakMessageRate: 0,
      errorCount: 0,
      lastResetTime: Date.now()
    };
    
    this.config = {
      maxQueueSize: 1000,
      logLevel: 'info',
      enableFiltering: true,
      enablePatternMatching: true,
      enableRealTimeAlerts: true,
      autoStart: true,
      performanceTracking: true,
      messageRetentionTime: 24 * 60 * 60 * 1000, // 24 hours
      maxProcessingTime: 100 // ms
    };
    
    // Advanced filtering capabilities
    this.filters = {
      active: [],
      presets: {
        errors: { level: 'error', type: 'error' },
        warnings: { level: 'warn', type: 'warning' },
        api: { source: 'api', category: 'network' },
        ui: { source: 'ui', category: 'interface' }
      }
    };
    
    if (this.config.autoStart) {
      this.start();
    }
  }

  start() {
    if (this.isActive) return;
    
    console.log('%c🔍 Extension Message Inspector Started', 'color: blue; font-size: 14px; font-weight: bold;');
    this.isActive = true;
    this.setupMessageListeners();
    this.startPerformanceMonitoring();
    this.startCleanupTimer();
  }

  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeMessageListeners();
    this.stopPerformanceMonitoring();
    this.messageQueue = [];
    console.log('✓ Extension Message Inspector Stopped');
  }

  setupMessageListeners() {
    // Chrome extension messaging
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(this.handleChromeMessage.bind(this));
    }

    // Browser extension messaging
    if (typeof browser !== 'undefined' && browser.runtime) {
      browser.runtime.onMessage.addListener(this.handleBrowserMessage.bind(this));
    }

    // Window messaging
    window.addEventListener('message', this.handleWindowMessage.bind(this));
    
    // Custom event messaging
    document.addEventListener('extensionMessage', this.handleCustomMessage.bind(this));
    
    // Error handling
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  removeMessageListeners() {
    window.removeEventListener('message', this.handleWindowMessage.bind(this));
    document.removeEventListener('extensionMessage', this.handleCustomMessage.bind(this));
    window.removeEventListener('error', this.handleError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  handleChromeMessage(message, sender, sendResponse) {
    const startTime = performance.now();
    this.logMessage('chrome', message, sender);
    const result = this.processMessage(message, sender, sendResponse);
    this.trackPerformance(startTime);
    return result;
  }

  handleBrowserMessage(message, sender, sendResponse) {
    const startTime = performance.now();
    this.logMessage('browser', message, sender);
    const result = this.processMessage(message, sender, sendResponse);
    this.trackPerformance(startTime);
    return result;
  }

  handleWindowMessage(event) {
    if (event.source !== window) return;
    const startTime = performance.now();
    this.logMessage('window', event.data, { origin: event.origin });
    this.trackPerformance(startTime);
  }

  handleCustomMessage(event) {
    const startTime = performance.now();
    this.logMessage('custom', event.detail, { type: 'custom' });
    this.trackPerformance(startTime);
  }

  handleError(event) {
    this.logMessage('error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }, { type: 'javascript_error' });
    this.performanceMetrics.errorCount++;
  }

  handleUnhandledRejection(event) {
    this.logMessage('error', {
      reason: event.reason,
      promise: event.promise
    }, { type: 'unhandled_promise_rejection' });
    this.performanceMetrics.errorCount++;
  }

  processMessage(message, sender, sendResponse) {
    // Add to queue
    this.addToQueue({
      timestamp: Date.now(),
      message,
      sender,
      type: 'extension'
    });

    // Check patterns and alerts
    this.checkPatterns(message);
    this.checkAlerts(message);

    // Process based on message type
    if (message.type === 'ping') {
      sendResponse({ status: 'pong', timestamp: Date.now() });
    } else if (message.type === 'inspector_status') {
      sendResponse(this.getStatus());
    } else if (message.type === 'inspector_stats') {
      sendResponse(this.getStats());
    }

    return true; // Keep message channel open
  }

  logMessage(source, message, metadata = {}) {
    if (!this.isActive) return;

    const logEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      source,
      message,
      metadata,
      level: this.determineLogLevel(message),
      category: this.categorizeMessage(message)
    };

    // Apply filters
    if (this.shouldFilterMessage(logEntry)) {
      return;
    }

    this.addToQueue(logEntry);

    if (this.config.logLevel === 'debug') {
      console.log(`[${source.toUpperCase()}]`, message, metadata);
    }

    // Real-time alerts
    if (this.config.enableRealTimeAlerts) {
      this.processRealTimeAlerts(logEntry);
    }
  }

  addToQueue(entry) {
    this.messageQueue.push(entry);
    this.performanceMetrics.totalMessages++;
    
    // Maintain queue size
    if (this.messageQueue.length > this.config.maxQueueSize) {
      this.messageQueue.shift();
    }
  }

  // Advanced filtering system
  addFilter(name, filterConfig) {
    this.filters.active.push({ name, ...filterConfig });
    console.log(`✓ Filter '${name}' added`);
  }

  removeFilter(name) {
    this.filters.active = this.filters.active.filter(f => f.name !== name);
    console.log(`✓ Filter '${name}' removed`);
  }

  shouldFilterMessage(entry) {
    if (!this.config.enableFiltering || this.filters.active.length === 0) {
      return false;
    }

    return this.filters.active.some(filter => {
      return Object.keys(filter).every(key => {
        if (key === 'name') return true;
        return entry[key] === filter[key] || 
               (entry.message && entry.message[key] === filter[key]);
      });
    });
  }

  // Pattern matching system
  addPattern(name, pattern, callback) {
    this.patterns.set(name, { pattern, callback });
    console.log(`✓ Pattern '${name}' added`);
  }

  removePattern(name) {
    this.patterns.delete(name);
    console.log(`✓ Pattern '${name}' removed`);
  }

  checkPatterns(message) {
    if (!this.config.enablePatternMatching) return;

    this.patterns.forEach((patternConfig, name) => {
      const { pattern, callback } = patternConfig;
      
      if (this.matchesPattern(message, pattern)) {
        try {
          callback(message, name);
        } catch (error) {
          console.error(`Pattern callback error for '${name}':`, error);
        }
      }
    });
  }

  matchesPattern(message, pattern) {
    if (typeof pattern === 'string') {
      return JSON.stringify(message).includes(pattern);
    }
    
    if (pattern instanceof RegExp) {
      return pattern.test(JSON.stringify(message));
    }
    
    if (typeof pattern === 'object') {
      return Object.keys(pattern).every(key => 
        message[key] === pattern[key]
      );
    }
    
    return false;
  }

  // Alert system
  addAlert(name, condition, action) {
    this.alerts.set(name, { condition, action });
    console.log(`✓ Alert '${name}' added`);
  }

  removeAlert(name) {
    this.alerts.delete(name);
    console.log(`✓ Alert '${name}' removed`);
  }

  checkAlerts(message) {
    this.alerts.forEach((alertConfig, name) => {
      const { condition, action } = alertConfig;
      
      if (this.evaluateCondition(message, condition)) {
        try {
          action(message, name);
        } catch (error) {
          console.error(`Alert action error for '${name}':`, error);
        }
      }
    });
  }

  evaluateCondition(message, condition) {
    if (typeof condition === 'function') {
      return condition(message);
    }
    
    if (typeof condition === 'object') {
      return Object.keys(condition).every(key => 
        message[key] === condition[key]
      );
    }
    
    return false;
  }

  processRealTimeAlerts(entry) {
    // High error rate alert
    if (entry.level === 'error') {
      const recentErrors = this.getMessages({
        level: 'error',
        since: Date.now() - 60000 // Last minute
      });
      
      if (recentErrors.length > 10) {
        console.warn('🚨 High error rate detected:', recentErrors.length, 'errors in the last minute');
      }
    }

    // Performance alert
    if (this.performanceMetrics.averageProcessingTime > this.config.maxProcessingTime) {
      console.warn('⚠️ High processing time detected:', this.performanceMetrics.averageProcessingTime, 'ms');
    }
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    if (!this.config.performanceTracking) return;
    
    this.performanceInterval = setInterval(() => {
      this.calculatePerformanceMetrics();
    }, 5000); // Every 5 seconds
  }

  stopPerformanceMonitoring() {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
    }
  }

  trackPerformance(startTime) {
    const processingTime = performance.now() - startTime;
    const currentAvg = this.performanceMetrics.averageProcessingTime;
    const totalMessages = this.performanceMetrics.totalMessages;
    
    this.performanceMetrics.averageProcessingTime = 
      (currentAvg * (totalMessages - 1) + processingTime) / totalMessages;
  }

  calculatePerformanceMetrics() {
    const now = Date.now();
    const timeSinceReset = now - this.performanceMetrics.lastResetTime;
    const messagesPerSecond = (this.performanceMetrics.totalMessages / timeSinceReset) * 1000;
    
    if (messagesPerSecond > this.performanceMetrics.peakMessageRate) {
      this.performanceMetrics.peakMessageRate = messagesPerSecond;
    }
  }

  // Cleanup timer
  startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMessages();
    }, 60000); // Every minute
  }

  cleanupOldMessages() {
    const cutoffTime = Date.now() - this.config.messageRetentionTime;
    const originalLength = this.messageQueue.length;
    
    this.messageQueue = this.messageQueue.filter(entry => 
      entry.timestamp > cutoffTime
    );
    
    const cleaned = originalLength - this.messageQueue.length;
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old messages`);
    }
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  determineLogLevel(message) {
    if (message.error || message.level === 'error') return 'error';
    if (message.warning || message.level === 'warn') return 'warn';
    if (message.info || message.level === 'info') return 'info';
    return 'debug';
  }

  categorizeMessage(message) {
    if (message.type) {
      if (message.type.includes('api') || message.type.includes('network')) return 'network';
      if (message.type.includes('ui') || message.type.includes('interface')) return 'interface';
      if (message.type.includes('auth')) return 'authentication';
      if (message.type.includes('data')) return 'data';
    }
    return 'general';
  }

  getMessages(filter = null) {
    if (!filter) return this.messageQueue;
    
    return this.messageQueue.filter(entry => {
      if (filter.source && entry.source !== filter.source) return false;
      if (filter.type && entry.message?.type !== filter.type) return false;
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.category && entry.category !== filter.category) return false;
      if (filter.since && entry.timestamp < filter.since) return false;
      if (filter.until && entry.timestamp > filter.until) return false;
      return true;
    });
  }

  getStats() {
    const stats = {
      totalMessages: this.messageQueue.length,
      sources: {},
      types: {},
      levels: {},
      categories: {},
      recentActivity: 0,
      performance: this.performanceMetrics,
      activeFilters: this.filters.active.length,
      activePatterns: this.patterns.size,
      activeAlerts: this.alerts.size
    };

    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    this.messageQueue.forEach(entry => {
      // Count by source
      stats.sources[entry.source] = (stats.sources[entry.source] || 0) + 1;
      
      // Count by message type
      if (entry.message?.type) {
        stats.types[entry.message.type] = (stats.types[entry.message.type] || 0) + 1;
      }

      // Count by level
      stats.levels[entry.level] = (stats.levels[entry.level] || 0) + 1;

      // Count by category
      stats.categories[entry.category] = (stats.categories[entry.category] || 0) + 1;

      // Recent activity
      if (entry.timestamp > fiveMinutesAgo) {
        stats.recentActivity++;
      }
    });

    return stats;
  }

  getStatus() {
    return {
      isActive: this.isActive,
      config: this.config,
      queueSize: this.messageQueue.length,
      performance: this.performanceMetrics,
      uptime: Date.now() - this.performanceMetrics.lastResetTime
    };
  }

  exportMessages(format = 'json', filter = null) {
    const messages = filter ? this.getMessages(filter) : this.messageQueue;
    
    const data = {
      exported: new Date().toISOString(),
      config: this.config,
      stats: this.getStats(),
      messages: messages
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(messages);
    }

    return data;
  }

  convertToCSV(messages) {
    if (messages.length === 0) return '';
    
    const headers = ['timestamp', 'source', 'level', 'category', 'type', 'message'];
    const rows = messages.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.source,
      entry.level,
      entry.category,
      entry.message?.type || '',
      JSON.stringify(entry.message).replace(/"/g, '""')
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  clearMessages() {
    this.messageQueue = [];
    this.performanceMetrics.totalMessages = 0;
    this.performanceMetrics.lastResetTime = Date.now();
    console.log('✓ Message queue cleared');
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('✓ Configuration updated', this.config);
  }

  // Advanced search capabilities
  search(query, options = {}) {
    const {
      caseSensitive = false,
      regex = false,
      fields = ['message'],
      limit = 100
    } = options;

    let searchFn;
    
    if (regex) {
      const pattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
      searchFn = (text) => pattern.test(text);
    } else {
      const searchTerm = caseSensitive ? query : query.toLowerCase();
      searchFn = (text) => {
        const searchText = caseSensitive ? text : text.toLowerCase();
        return searchText.includes(searchTerm);
      };
    }

    const results = this.messageQueue.filter(entry => {
      return fields.some(field => {
        const value = field === 'message' ? JSON.stringify(entry.message) : entry[field];
        return value && searchFn(String(value));
      });
    }).slice(0, limit);

    return {
      query,
      options,
      results,
      totalFound: results.length,
      searchTime: Date.now()
    };
  }
}

// Initialize and expose globally
const msgInspector = new ExtensionMessageInspector();

// Expose to global scope for debugging
window.ExtensionMessageInspector = msgInspector;

// Add some useful preset patterns
msgInspector.addPattern('api_errors', /error.*api/i, (message, name) => {
  console.warn(`🔍 API Error detected:`, message);
});

msgInspector.addPattern('auth_events', { type: 'auth' }, (message, name) => {
  console.log(`🔐 Auth event:`, message);
});

// Add useful alerts
msgInspector.addAlert('high_error_rate', 
  (message) => message.level === 'error',
  (message, name) => {
    const recentErrors = msgInspector.getMessages({
      level: 'error',
      since: Date.now() - 30000 // Last 30 seconds
    });
    
    if (recentErrors.length > 5) {
      console.error(`🚨 High error rate: ${recentErrors.length} errors in 30 seconds`);
    }
  }
);

console.log('%cExtension Message Inspector Ready', 'color: purple; font-size: 14px; font-weight: bold;');
console.log('%cAdvanced features: Pattern matching, Real-time alerts, Performance monitoring', 'color: green; font-size: 12px;');

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionMessageInspector;
}