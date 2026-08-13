'use strict';
/**
 * Application Performance Monitoring (APM)
 * Tracks backend performance, database queries, and service metrics
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.APMService = void 0;
exports.createAPMFromEnv = createAPMFromEnv;
class APMService {
  config;
  activeTransactions = new Map();
  activeSpans = new Map();
  completedTransactions = [];
  constructor(config) {
    this.config = {
      enabled: true,
      serviceName: 'default-service',
      environment: 'development',
      sampleRate: 1.0,
      slowQueryThreshold: 100,
      slowRequestThreshold: 1000,
      captureHeaders: false,
      captureBody: false,
      ...config,
    };
  }
  /**
   * Initialize APM service
   */
  async initialize() {
    if (!this.config.enabled) {
      return;
    }
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }
  /**
   * Start a new transaction
   */
  startTransaction(name, type = 'request') {
    if (!this.shouldSample()) {
      return this.createDummyTransaction(name, type);
    }
    const transaction = {
      id: this.generateId(),
      name,
      type,
      startTime: Date.now(),
      spans: [],
      context: {},
    };
    this.activeTransactions.set(transaction.id, transaction);
    return transaction;
  }
  /**
   * End a transaction
   */
  endTransaction(transactionId, result = 'success') {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      return;
    }
    transaction.endTime = Date.now();
    transaction.duration = transaction.endTime - transaction.startTime;
    transaction.result = result;
    // Check if this is a slow transaction
    if (
      this.config.slowRequestThreshold &&
      transaction.duration > this.config.slowRequestThreshold
    ) {
      console.warn(`Slow transaction detected: ${transaction.name} took ${transaction.duration}ms`);
    }
    this.activeTransactions.delete(transactionId);
    this.completedTransactions.push(transaction);
    // Keep only last 1000 transactions
    if (this.completedTransactions.length > 1000) {
      this.completedTransactions.shift();
    }
  }
  /**
   * Start a span within a transaction
   */
  startSpan(transactionId, name, type, subtype, parentId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      return this.createDummySpan(name, type);
    }
    const span = {
      id: this.generateId(),
      transactionId,
      parentId,
      name,
      type,
      subtype,
      startTime: Date.now(),
      context: {},
    };
    this.activeSpans.set(span.id, span);
    transaction.spans.push(span);
    return span;
  }
  /**
   * End a span
   */
  endSpan(spanId) {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    // Check if this is a slow database query
    if (
      span.type === 'db' &&
      this.config.slowQueryThreshold &&
      span.duration > this.config.slowQueryThreshold
    ) {
      console.warn(`Slow query detected: ${span.name} took ${span.duration}ms`);
      if (span.context?.db?.statement) {
        console.warn(`Query: ${span.context.db.statement}`);
      }
    }
    this.activeSpans.delete(spanId);
  }
  /**
   * Set transaction context
   */
  setTransactionContext(transactionId, context) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      return;
    }
    transaction.context = {
      ...transaction.context,
      ...context,
    };
  }
  /**
   * Set span context
   */
  setSpanContext(spanId, context) {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }
    span.context = {
      ...span.context,
      ...context,
    };
  }
  /**
   * Track database query
   */
  trackDatabaseQuery(transactionId, dbType, query, callback) {
    const span = this.startSpan(transactionId, query.substring(0, 100), 'db', dbType);
    this.setSpanContext(span.id, {
      db: {
        type: dbType,
        statement: query,
      },
    });
    return callback()
      .then((result) => {
        this.endSpan(span.id);
        return result;
      })
      .catch((error) => {
        this.endSpan(span.id);
        throw error;
      });
  }
  /**
   * Track HTTP request
   */
  trackHttpRequest(transactionId, method, url, callback) {
    const span = this.startSpan(transactionId, `${method} ${url}`, 'http', 'request');
    this.setSpanContext(span.id, {
      http: {
        method,
        url,
      },
    });
    return callback()
      .then((result) => {
        if (result?.statusCode) {
          this.setSpanContext(span.id, {
            http: {
              method,
              url,
              statusCode: result.statusCode,
            },
          });
        }
        this.endSpan(span.id);
        return result;
      })
      .catch((error) => {
        this.endSpan(span.id);
        throw error;
      });
  }
  /**
   * Get transaction by ID
   */
  getTransaction(transactionId) {
    return this.activeTransactions.get(transactionId);
  }
  /**
   * Get all active transactions
   */
  getActiveTransactions() {
    return Array.from(this.activeTransactions.values());
  }
  /**
   * Get completed transactions
   */
  getCompletedTransactions(limit = 100) {
    return this.completedTransactions.slice(-limit);
  }
  /**
   * Get performance metrics
   */
  getMetrics() {
    const completed = this.completedTransactions;
    const avgDuration =
      completed.length > 0
        ? completed.reduce((sum, t) => sum + (t.duration || 0), 0) / completed.length
        : 0;
    const slowTransactions = completed.filter(
      (t) => t.duration && t.duration > (this.config.slowRequestThreshold || 1000)
    ).length;
    return {
      activeTransactions: this.activeTransactions.size,
      completedTransactions: completed.length,
      averageDuration: Math.round(avgDuration),
      slowTransactions,
    };
  }
  /**
   * Should sample this transaction
   */
  shouldSample() {
    return Math.random() < (this.config.sampleRate || 1.0);
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Create dummy transaction (for non-sampled requests)
   */
  createDummyTransaction(name, type) {
    return {
      id: 'dummy',
      name,
      type,
      startTime: Date.now(),
      spans: [],
    };
  }
  /**
   * Create dummy span (for non-sampled requests)
   */
  createDummySpan(name, type) {
    return {
      id: 'dummy',
      transactionId: 'dummy',
      name,
      type,
      startTime: Date.now(),
    };
  }
  /**
   * Cleanup old transactions
   */
  cleanup() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    // Clean up stale active transactions
    for (const [id, transaction] of this.activeTransactions.entries()) {
      if (now - transaction.startTime > timeout) {
        console.warn(`Cleaning up stale transaction: ${transaction.name}`);
        this.endTransaction(id, 'timeout');
      }
    }
    // Clean up stale active spans
    for (const [id, span] of this.activeSpans.entries()) {
      if (now - span.startTime > timeout) {
        console.warn(`Cleaning up stale span: ${span.name}`);
        this.endSpan(id);
      }
    }
  }
}
exports.APMService = APMService;
/**
 * Create APM service from environment variables
 */
function createAPMFromEnv() {
  return new APMService({
    enabled: process.env.APM_ENABLED !== 'false',
    serviceName: process.env.SERVICE_NAME || 'default-service',
    environment: process.env.NODE_ENV || 'development',
    sampleRate: parseFloat(process.env.APM_SAMPLE_RATE || '1.0'),
    slowQueryThreshold: parseInt(process.env.APM_SLOW_QUERY_THRESHOLD || '100'),
    slowRequestThreshold: parseInt(process.env.APM_SLOW_REQUEST_THRESHOLD || '1000'),
    captureHeaders: process.env.APM_CAPTURE_HEADERS === 'true',
    captureBody: process.env.APM_CAPTURE_BODY === 'true',
  });
}
//# sourceMappingURL=apm.js.map
