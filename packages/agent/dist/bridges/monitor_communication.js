"use strict";
/**
 * Monitor Communication - Communication monitoring and analytics
 *
 * Provides monitoring for communication patterns:
 * - Message tracking
 * - Latency measurement
 * - Throughput analytics
 * - Error tracking
 * - Communication patterns analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorCommunication = void 0;
const events_1 = require("events");
// ============================================================
// MONITOR COMMUNICATION
// ============================================================
class MonitorCommunication extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = [];
        this.maxMetricsSize = 50000;
        this.trackingEnabled = true;
        this.latencyThreshold = 5000;
        this.errorRateThreshold = 0.1;
    }
    /**
     * Track a message
     */
    trackMessage(metric) {
        if (!this.trackingEnabled)
            return;
        const fullMetric = {
            ...metric,
            id: `metric-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            timestamp: new Date(),
        };
        this.metrics.push(fullMetric);
        if (this.metrics.length > this.maxMetricsSize) {
            this.metrics = this.metrics.slice(-this.maxMetricsSize / 2);
        }
        this.emit('message:tracked', fullMetric);
        // Check thresholds
        this.checkThresholds(fullMetric);
    }
    /**
     * Track message latency
     */
    trackLatency(messageId, latency) {
        const metric = this.metrics.find((m) => m.id === messageId);
        if (metric) {
            metric.latency = latency;
            this.emit('latency:recorded', { messageId, latency });
        }
    }
    /**
     * Track message error
     */
    trackError(messageId, error) {
        const metric = this.metrics.find((m) => m.id === messageId);
        if (metric) {
            metric.success = false;
            metric.error = error;
            this.emit('error:recorded', { messageId, error });
        }
    }
    // ============================================================
    // ANALYTICS
    // ============================================================
    /**
     * Get overall statistics
     */
    getStats(since) {
        const filtered = since ? this.metrics.filter((m) => m.timestamp >= since) : this.metrics;
        const messagesByType = {};
        const messagesByAgent = {};
        let totalLatency = 0;
        let latencyCount = 0;
        for (const metric of filtered) {
            messagesByType[metric.type] = (messagesByType[metric.type] || 0) + 1;
            messagesByAgent[metric.from] = (messagesByAgent[metric.from] || 0) + 1;
            if (metric.latency !== undefined) {
                totalLatency += metric.latency;
                latencyCount++;
            }
        }
        return {
            totalMessages: filtered.length,
            successfulMessages: filtered.filter((m) => m.success).length,
            failedMessages: filtered.filter((m) => !m.success).length,
            averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
            messagesByType,
            messagesByAgent,
            throughput: this.calculateThroughput(),
        };
    }
    /**
     * Get agent communication pattern
     */
    getAgentPattern(agentId) {
        const sent = this.metrics.filter((m) => m.from === agentId);
        const received = this.metrics.filter((m) => m.to === agentId);
        const recipientCounts = new Map();
        for (const metric of sent) {
            recipientCounts.set(metric.to, (recipientCounts.get(metric.to) || 0) + 1);
        }
        const senderCounts = new Map();
        for (const metric of received) {
            senderCounts.set(metric.from, (senderCounts.get(metric.from) || 0) + 1);
        }
        const topRecipients = Array.from(recipientCounts.entries())
            .map(([agentId, count]) => ({ agentId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const topSenders = Array.from(senderCounts.entries())
            .map(([agentId, count]) => ({ agentId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const latencies = sent.filter((m) => m.latency !== undefined).map((m) => m.latency);
        return {
            agentId,
            messagesSent: sent.length,
            messagesReceived: received.length,
            topRecipients,
            topSenders,
            averageResponseTime: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        };
    }
    /**
     * Get latency percentiles
     */
    getLatencyPercentiles() {
        const latencies = this.metrics
            .filter((m) => m.latency !== undefined)
            .map((m) => m.latency)
            .sort((a, b) => a - b);
        if (latencies.length === 0) {
            return { p50: 0, p90: 0, p95: 0, p99: 0 };
        }
        return {
            p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
            p90: latencies[Math.floor(latencies.length * 0.9)] || 0,
            p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
            p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
        };
    }
    /**
     * Get error rate
     */
    getErrorRate(windowMs = 60000) {
        const since = new Date(Date.now() - windowMs);
        const recent = this.metrics.filter((m) => m.timestamp >= since);
        if (recent.length === 0)
            return 0;
        return recent.filter((m) => !m.success).length / recent.length;
    }
    /**
     * Calculate throughput
     */
    calculateThroughput() {
        const now = Date.now();
        return {
            lastMinute: this.metrics.filter((m) => m.timestamp.getTime() > now - 60000).length,
            lastHour: this.metrics.filter((m) => m.timestamp.getTime() > now - 3600000).length,
            lastDay: this.metrics.filter((m) => m.timestamp.getTime() > now - 86400000).length,
        };
    }
    // ============================================================
    // ALERTING
    // ============================================================
    /**
     * Check thresholds and emit alerts
     */
    checkThresholds(metric) {
        // High latency alert
        if (metric.latency !== undefined && metric.latency > this.latencyThreshold) {
            this.emit('alert:high-latency', { metric, threshold: this.latencyThreshold });
        }
        // Check error rate periodically
        const errorRate = this.getErrorRate();
        if (errorRate > this.errorRateThreshold) {
            this.emit('alert:high-error-rate', { errorRate, threshold: this.errorRateThreshold });
        }
    }
    /**
     * Set latency threshold
     */
    setLatencyThreshold(ms) {
        this.latencyThreshold = ms;
    }
    /**
     * Set error rate threshold
     */
    setErrorRateThreshold(rate) {
        this.errorRateThreshold = rate;
    }
    // ============================================================
    // CONTROL
    // ============================================================
    /**
     * Enable tracking
     */
    enableTracking() {
        this.trackingEnabled = true;
    }
    /**
     * Disable tracking
     */
    disableTracking() {
        this.trackingEnabled = false;
    }
    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics = [];
        this.emit('metrics:cleared');
    }
    /**
     * Export metrics
     */
    exportMetrics() {
        return [...this.metrics];
    }
    /**
     * Get tracking status
     */
    isTrackingEnabled() {
        return this.trackingEnabled;
    }
}
exports.MonitorCommunication = MonitorCommunication;
exports.default = MonitorCommunication;
//# sourceMappingURL=monitor_communication.js.map