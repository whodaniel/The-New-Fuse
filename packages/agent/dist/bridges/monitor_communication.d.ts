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
import { EventEmitter } from 'events';
import { MessageType } from './index.js';
export interface MessageMetric {
    id: string;
    from: string;
    to: string;
    type: MessageType;
    size: number;
    latency?: number;
    success: boolean;
    timestamp: Date;
    error?: string;
}
export interface CommunicationStats {
    totalMessages: number;
    successfulMessages: number;
    failedMessages: number;
    averageLatency: number;
    messagesByType: Record<string, number>;
    messagesByAgent: Record<string, number>;
    throughput: {
        lastMinute: number;
        lastHour: number;
        lastDay: number;
    };
}
export interface AgentCommunicationPattern {
    agentId: string;
    messagesSent: number;
    messagesReceived: number;
    topRecipients: Array<{
        agentId: string;
        count: number;
    }>;
    topSenders: Array<{
        agentId: string;
        count: number;
    }>;
    averageResponseTime: number;
}
export declare class MonitorCommunication extends EventEmitter {
    private metrics;
    private maxMetricsSize;
    private trackingEnabled;
    private latencyThreshold;
    private errorRateThreshold;
    constructor();
    /**
     * Track a message
     */
    trackMessage(metric: Omit<MessageMetric, 'id' | 'timestamp'>): void;
    /**
     * Track message latency
     */
    trackLatency(messageId: string, latency: number): void;
    /**
     * Track message error
     */
    trackError(messageId: string, error: string): void;
    /**
     * Get overall statistics
     */
    getStats(since?: Date): CommunicationStats;
    /**
     * Get agent communication pattern
     */
    getAgentPattern(agentId: string): AgentCommunicationPattern;
    /**
     * Get latency percentiles
     */
    getLatencyPercentiles(): {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
    /**
     * Get error rate
     */
    getErrorRate(windowMs?: number): number;
    /**
     * Calculate throughput
     */
    private calculateThroughput;
    /**
     * Check thresholds and emit alerts
     */
    private checkThresholds;
    /**
     * Set latency threshold
     */
    setLatencyThreshold(ms: number): void;
    /**
     * Set error rate threshold
     */
    setErrorRateThreshold(rate: number): void;
    /**
     * Enable tracking
     */
    enableTracking(): void;
    /**
     * Disable tracking
     */
    disableTracking(): void;
    /**
     * Clear metrics
     */
    clearMetrics(): void;
    /**
     * Export metrics
     */
    exportMetrics(): MessageMetric[];
    /**
     * Get tracking status
     */
    isTrackingEnabled(): boolean;
}
export default MonitorCommunication;
//# sourceMappingURL=monitor_communication.d.ts.map