/**
 * TNF Extension Message Inspector Test Suite
 * Comprehensive testing for advanced message monitoring capabilities
 */

// Mock browser APIs
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

const mockBrowser = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

// Setup global mocks
global.chrome = mockChrome;
global.browser = mockBrowser;
global.performance = {
  now: jest.fn(() => Date.now())
};

// Import the inspector
const ExtensionMessageInspector = require('./extension-message-inspector');

describe('ExtensionMessageInspector', () => {
  let inspector;
  let consoleSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation()
    };

    // Create new inspector instance
    inspector = new ExtensionMessageInspector();
    inspector.config.autoStart = false; // Prevent auto-start in tests
  });

  afterEach(() => {
    if (inspector.isActive) {
      inspector.stop();
    }
    
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(inspector.isActive).toBe(false);
      expect(inspector.messageQueue).toEqual([]);
      expect(inspector.config.maxQueueSize).toBe(1000);
      expect(inspector.config.enableFiltering).toBe(true);
      expect(inspector.config.enablePatternMatching).toBe(true);
      expect(inspector.config.enableRealTimeAlerts).toBe(true);
    });

    test('should initialize performance metrics', () => {
      expect(inspector.performanceMetrics).toEqual({
        totalMessages: 0,
        averageProcessingTime: 0,
        peakMessageRate: 0,
        errorCount: 0,
        lastResetTime: expect.any(Number)
      });
    });

    test('should initialize filter system', () => {
      expect(inspector.filters.active).toEqual([]);
      expect(inspector.filters.presets).toHaveProperty('errors');
      expect(inspector.filters.presets).toHaveProperty('warnings');
      expect(inspector.filters.presets).toHaveProperty('api');
      expect(inspector.filters.presets).toHaveProperty('ui');
    });
  });

  describe('Start/Stop Functionality', () => {
    test('should start inspector and set up listeners', () => {
      inspector.start();
      
      expect(inspector.isActive).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Extension Message Inspector Started')
      );
    });

    test('should stop inspector and clean up', () => {
      inspector.start();
      inspector.stop();
      
      expect(inspector.isActive).toBe(false);
      expect(inspector.messageQueue).toEqual([]);
      expect(consoleSpy.log).toHaveBeenCalledWith('✓ Extension Message Inspector Stopped');
    });

    test('should not start if already active', () => {
      inspector.start();
      const logCallCount = consoleSpy.log.mock.calls.length;
      
      inspector.start(); // Try to start again
      
      expect(consoleSpy.log.mock.calls.length).toBe(logCallCount); // No additional log
    });
  });

  describe('Message Processing', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should process Chrome extension messages', () => {
      const message = { type: 'test', data: 'hello' };
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();

      const result = inspector.handleChromeMessage(message, sender, sendResponse);

      expect(result).toBe(true);
      expect(inspector.messageQueue.length).toBe(1);
      expect(inspector.messageQueue[0]).toMatchObject({
        source: 'chrome',
        message,
        metadata: sender
      });
    });

    test('should process browser extension messages', () => {
      const message = { type: 'test', data: 'hello' };
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();

      const result = inspector.handleBrowserMessage(message, sender, sendResponse);

      expect(result).toBe(true);
      expect(inspector.messageQueue.length).toBe(1);
      expect(inspector.messageQueue[0]).toMatchObject({
        source: 'browser',
        message,
        metadata: sender
      });
    });

    test('should handle ping messages', () => {
      const message = { type: 'ping' };
      const sender = {};
      const sendResponse = jest.fn();

      inspector.processMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        status: 'pong',
        timestamp: expect.any(Number)
      });
    });

    test('should handle inspector status requests', () => {
      const message = { type: 'inspector_status' };
      const sender = {};
      const sendResponse = jest.fn();

      inspector.processMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          config: expect.any(Object),
          queueSize: expect.any(Number)
        })
      );
    });

    test('should handle inspector stats requests', () => {
      const message = { type: 'inspector_stats' };
      const sender = {};
      const sendResponse = jest.fn();

      inspector.processMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          totalMessages: expect.any(Number),
          sources: expect.any(Object),
          types: expect.any(Object),
          performance: expect.any(Object)
        })
      );
    });
  });

  describe('Advanced Filtering', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should add and remove filters', () => {
      const filterConfig = { level: 'error', source: 'api' };
      
      inspector.addFilter('test_filter', filterConfig);
      
      expect(inspector.filters.active).toHaveLength(1);
      expect(inspector.filters.active[0]).toMatchObject({
        name: 'test_filter',
        ...filterConfig
      });
      expect(consoleSpy.log).toHaveBeenCalledWith("✓ Filter 'test_filter' added");

      inspector.removeFilter('test_filter');
      
      expect(inspector.filters.active).toHaveLength(0);
      expect(consoleSpy.log).toHaveBeenCalledWith("✓ Filter 'test_filter' removed");
    });

    test('should filter messages based on active filters', () => {
      inspector.addFilter('error_filter', { level: 'error' });
      
      // This message should be filtered out
      inspector.logMessage('test', { type: 'error' }, {});
      
      expect(inspector.messageQueue).toHaveLength(0);
    });

    test('should not filter when filtering is disabled', () => {
      inspector.config.enableFiltering = false;
      inspector.addFilter('error_filter', { level: 'error' });
      
      inspector.logMessage('test', { type: 'error' }, {});
      
      expect(inspector.messageQueue).toHaveLength(1);
    });
  });

  describe('Pattern Matching', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should add and remove patterns', () => {
      const callback = jest.fn();
      
      inspector.addPattern('test_pattern', /error/i, callback);
      
      expect(inspector.patterns.has('test_pattern')).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith("✓ Pattern 'test_pattern' added");

      inspector.removePattern('test_pattern');
      
      expect(inspector.patterns.has('test_pattern')).toBe(false);
      expect(consoleSpy.log).toHaveBeenCalledWith("✓ Pattern 'test_pattern' removed");
    });

    test('should match string patterns', () => {
      const callback = jest.fn();
      inspector.addPattern('string_pattern', 'error', callback);
      
      const message = { type: 'error', data: 'test' };
      inspector.processMessage(message, {}, jest.fn());
      
      expect(callback).toHaveBeenCalledWith(message, 'string_pattern');
    });

    test('should match regex patterns', () => {
      const callback = jest.fn();
      inspector.addPattern('regex_pattern', /error/i, callback);
      
      const message = { type: 'ERROR', data: 'test' };
      inspector.processMessage(message, {}, jest.fn());
      
      expect(callback).toHaveBeenCalledWith(message, 'regex_pattern');
    });

    test('should match object patterns', () => {
      const callback = jest.fn();
      inspector.addPattern('object_pattern', { type: 'auth' }, callback);
      
      const message = { type: 'auth', user: 'test' };
      inspector.processMessage(message, {}, jest.fn());
      
      expect(callback).toHaveBeenCalledWith(message, 'object_pattern');
    });

    test('should handle pattern callback errors', () => {
      const callback = jest.fn(() => {
        throw new Error('Pattern callback error');
      });
      inspector.addPattern('error_pattern', 'test', callback);
      
      const message = { type: 'test' };
      inspector.processMessage(message, {}, jest.fn());
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Pattern callback error for 'error_pattern':",
        expect.any(Error)
      );
    });
  });

  describe('Alert System', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should add and remove alerts', () => {
      const condition = (message) => message.level === 'error';
      const action = jest.fn();
      
      inspector.addAlert('test_alert', condition, action);
      
      expect(inspector.alerts.has('test_alert')).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith("✓ Alert 'test_alert' added");

      inspector.removeAlert('test_alert');
      
      expect(inspector.alerts.has('test_alert')).toBe(false);
      expect(consoleSpy.log).toHaveBeenCalledWith("✓ Alert 'test_alert' removed");
    });

    test('should trigger alerts on matching conditions', () => {
      const action = jest.fn();
      inspector.addAlert('error_alert', (message) => message.type === 'error', action);
      
      const message = { type: 'error', data: 'test' };
      inspector.processMessage(message, {}, jest.fn());
      
      expect(action).toHaveBeenCalledWith(message, 'error_alert');
    });

    test('should handle alert action errors', () => {
      const action = jest.fn(() => {
        throw new Error('Alert action error');
      });
      inspector.addAlert('error_alert', (message) => true, action);
      
      const message = { type: 'test' };
      inspector.processMessage(message, {}, jest.fn());
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Alert action error for 'error_alert':",
        expect.any(Error)
      );
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should track performance metrics', () => {
      const startTime = 100;
      const endTime = 150;
      
      global.performance.now
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      inspector.handleChromeMessage({ type: 'test' }, {}, jest.fn());

      expect(inspector.performanceMetrics.totalMessages).toBe(1);
      expect(inspector.performanceMetrics.averageProcessingTime).toBe(50);
    });

    test('should update average processing time correctly', () => {
      // First message: 50ms
      global.performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(50);
      inspector.handleChromeMessage({ type: 'test1' }, {}, jest.fn());

      // Second message: 100ms
      global.performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);
      inspector.handleChromeMessage({ type: 'test2' }, {}, jest.fn());

      expect(inspector.performanceMetrics.averageProcessingTime).toBe(75);
    });

    test('should track error count', () => {
      const errorEvent = {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: new Error('Test error')
      };

      inspector.handleError(errorEvent);

      expect(inspector.performanceMetrics.errorCount).toBe(1);
      expect(inspector.messageQueue).toHaveLength(1);
      expect(inspector.messageQueue[0].source).toBe('error');
    });
  });

  describe('Message Queue Management', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should maintain maximum queue size', () => {
      inspector.config.maxQueueSize = 3;

      // Add 5 messages
      for (let i = 0; i < 5; i++) {
        inspector.logMessage('test', { id: i }, {});
      }

      expect(inspector.messageQueue).toHaveLength(3);
      expect(inspector.messageQueue[0].message.id).toBe(2); // First two removed
    });

    test('should clean up old messages', () => {
      inspector.config.messageRetentionTime = 1000; // 1 second
      
      // Add old message
      const oldTimestamp = Date.now() - 2000;
      inspector.messageQueue.push({
        timestamp: oldTimestamp,
        source: 'test',
        message: { old: true }
      });

      // Add recent message
      inspector.logMessage('test', { recent: true }, {});

      inspector.cleanupOldMessages();

      expect(inspector.messageQueue).toHaveLength(1);
      expect(inspector.messageQueue[0].message.recent).toBe(true);
    });

    test('should clear all messages', () => {
      inspector.logMessage('test', { data: 'test' }, {});
      expect(inspector.messageQueue).toHaveLength(1);

      inspector.clearMessages();

      expect(inspector.messageQueue).toHaveLength(0);
      expect(inspector.performanceMetrics.totalMessages).toBe(0);
      expect(consoleSpy.log).toHaveBeenCalledWith('✓ Message queue cleared');
    });
  });

  describe('Message Filtering and Search', () => {
    beforeEach(() => {
      inspector.start();
      
      // Add test messages
      inspector.logMessage('chrome', { type: 'auth', user: 'test1' }, {});
      inspector.logMessage('browser', { type: 'api', endpoint: '/users' }, {});
      inspector.logMessage('window', { type: 'error', message: 'Failed' }, {});
    });

    test('should filter messages by source', () => {
      const filtered = inspector.getMessages({ source: 'chrome' });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].source).toBe('chrome');
    });

    test('should filter messages by type', () => {
      const filtered = inspector.getMessages({ type: 'auth' });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].message.type).toBe('auth');
    });

    test('should filter messages by level', () => {
      const filtered = inspector.getMessages({ level: 'error' });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].level).toBe('error');
    });

    test('should filter messages by time range', () => {
      const now = Date.now();
      const filtered = inspector.getMessages({ 
        since: now - 1000,
        until: now + 1000
      });
      
      expect(filtered).toHaveLength(3); // All messages within range
    });

    test('should search messages with string query', () => {
      const results = inspector.search('auth');
      
      expect(results.results).toHaveLength(1);
      expect(results.results[0].message.type).toBe('auth');
      expect(results.totalFound).toBe(1);
    });

    test('should search messages with regex', () => {
      const results = inspector.search('auth|api', { regex: true });
      
      expect(results.results).toHaveLength(2);
      expect(results.totalFound).toBe(2);
    });

    test('should search with case sensitivity', () => {
      const results = inspector.search('AUTH', { caseSensitive: true });
      
      expect(results.results).toHaveLength(0);
    });

    test('should limit search results', () => {
      const results = inspector.search('', { limit: 2 });
      
      expect(results.results).toHaveLength(2);
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      inspector.start();
      inspector.logMessage('test', { type: 'export_test' }, {});
    });

    test('should export messages as JSON', () => {
      const exported = inspector.exportMessages('json');
      const data = JSON.parse(exported);
      
      expect(data).toHaveProperty('exported');
      expect(data).toHaveProperty('config');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('messages');
      expect(data.messages).toHaveLength(1);
    });

    test('should export messages as CSV', () => {
      const csv = inspector.exportMessages('csv');
      
      expect(csv).toContain('timestamp,source,level,category,type,message');
      expect(csv).toContain('test');
      expect(csv).toContain('export_test');
    });

    test('should export filtered messages', () => {
      inspector.logMessage('other', { type: 'other_test' }, {});
      
      const exported = inspector.exportMessages('json', { source: 'test' });
      const data = JSON.parse(exported);
      
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].source).toBe('test');
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        maxQueueSize: 500,
        logLevel: 'debug',
        enableFiltering: false
      };

      inspector.updateConfig(newConfig);

      expect(inspector.config.maxQueueSize).toBe(500);
      expect(inspector.config.logLevel).toBe('debug');
      expect(inspector.config.enableFiltering).toBe(false);
      expect(consoleSpy.log).toHaveBeenCalledWith('✓ Configuration updated', inspector.config);
    });
  });

  describe('Statistics and Status', () => {
    beforeEach(() => {
      inspector.start();
      inspector.logMessage('chrome', { type: 'auth' }, {});
      inspector.logMessage('browser', { type: 'api' }, {});
    });

    test('should provide comprehensive statistics', () => {
      const stats = inspector.getStats();
      
      expect(stats).toHaveProperty('totalMessages', 2);
      expect(stats).toHaveProperty('sources');
      expect(stats).toHaveProperty('types');
      expect(stats).toHaveProperty('levels');
      expect(stats).toHaveProperty('categories');
      expect(stats).toHaveProperty('performance');
      expect(stats.sources.chrome).toBe(1);
      expect(stats.sources.browser).toBe(1);
    });

    test('should provide current status', () => {
      const status = inspector.getStatus();
      
      expect(status).toHaveProperty('isActive', true);
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('queueSize', 2);
      expect(status).toHaveProperty('performance');
      expect(status).toHaveProperty('uptime');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should handle unhandled promise rejections', () => {
      const rejectionEvent = {
        reason: 'Test rejection',
        promise: Promise.reject('test')
      };

      inspector.handleUnhandledRejection(rejectionEvent);

      expect(inspector.performanceMetrics.errorCount).toBe(1);
      expect(inspector.messageQueue).toHaveLength(1);
      expect(inspector.messageQueue[0].source).toBe('error');
      expect(inspector.messageQueue[0].metadata.type).toBe('unhandled_promise_rejection');
    });

    test('should categorize messages correctly', () => {
      expect(inspector.categorizeMessage({ type: 'api_call' })).toBe('network');
      expect(inspector.categorizeMessage({ type: 'ui_update' })).toBe('interface');
      expect(inspector.categorizeMessage({ type: 'auth_login' })).toBe('authentication');
      expect(inspector.categorizeMessage({ type: 'data_sync' })).toBe('data');
      expect(inspector.categorizeMessage({ type: 'unknown' })).toBe('general');
    });

    test('should determine log levels correctly', () => {
      expect(inspector.determineLogLevel({ error: true })).toBe('error');
      expect(inspector.determineLogLevel({ level: 'error' })).toBe('error');
      expect(inspector.determineLogLevel({ warning: true })).toBe('warn');
      expect(inspector.determineLogLevel({ level: 'warn' })).toBe('warn');
      expect(inspector.determineLogLevel({ info: true })).toBe('info');
      expect(inspector.determineLogLevel({ level: 'info' })).toBe('info');
      expect(inspector.determineLogLevel({ type: 'debug' })).toBe('debug');
    });
  });

  describe('Real-time Alerts', () => {
    beforeEach(() => {
      inspector.start();
    });

    test('should trigger high error rate alert', () => {
      // Add multiple error messages quickly
      for (let i = 0; i < 12; i++) {
        inspector.logMessage('test', { type: 'error' }, {});
      }

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '🚨 High error rate detected:',
        expect.any(Number),
        'errors in the last minute'
      );
    });

    test('should trigger performance alert', () => {
      inspector.performanceMetrics.averageProcessingTime = 150; // Above threshold
      
      inspector.processRealTimeAlerts({ level: 'info' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '⚠️ High processing time detected:',
        150,
        'ms'
      );
    });
  });
});

// Integration tests
describe('ExtensionMessageInspector Integration', () => {
  let inspector;

  beforeEach(() => {
    inspector = new ExtensionMessageInspector();
    inspector.config.autoStart = false;
  });

  afterEach(() => {
    if (inspector.isActive) {
      inspector.stop();
    }
  });

  test('should handle complex message flow with patterns and alerts', (done) => {
    inspector.start();

    let patternTriggered = false;
    let alertTriggered = false;

    // Add pattern
    inspector.addPattern('auth_pattern', { type: 'auth' }, () => {
      patternTriggered = true;
    });

    // Add alert
    inspector.addAlert('auth_alert', (msg) => msg.type === 'auth', () => {
      alertTriggered = true;
    });

    // Process message
    inspector.processMessage({ type: 'auth', user: 'test' }, {}, jest.fn());

    // Verify both pattern and alert were triggered
    setTimeout(() => {
      expect(patternTriggered).toBe(true);
      expect(alertTriggered).toBe(true);
      expect(inspector.messageQueue).toHaveLength(1);
      done();
    }, 10);
  });

  test('should maintain performance under high message volume', () => {
    inspector.start();
    
    const startTime = Date.now();
    const messageCount = 1000;

    // Process many messages
    for (let i = 0; i < messageCount; i++) {
      inspector.logMessage('test', { id: i, type: 'bulk_test' }, {});
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    expect(inspector.messageQueue.length).toBeLessThanOrEqual(inspector.config.maxQueueSize);
    expect(processingTime).toBeLessThan(1000); // Should process 1000 messages in under 1 second
    expect(inspector.performanceMetrics.totalMessages).toBe(messageCount);
  });
});