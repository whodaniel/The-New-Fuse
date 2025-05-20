import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { PerformanceObserver, performance } from 'perf_hooks';
import * as os from 'os';

export interface MCPMetrics {
    connections: number;
    messageRate: number;
    averageLatency: number;
    errorRate: number;
    activeTools: number;
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
}

export interface MCPAlert {
    type: 'error' | 'warning';
    message: string;
    timestamp: number;
}

interface MetricEntry {
    timestamp: number;
    avgResponseTime: number;
    successRate: number;
    requestCount: number;
}

export class MCPMonitor extends EventEmitter {
    private static instance: MCPMonitor;
    private metrics: MCPMetrics;
    private alerts: MCPAlert[] = [];
    private messageHistory: number[] = [];
    private latencyHistory: number[] = [];
    private errorHistory: { timestamp: number; count: number }[] = [];
    private startTime: number;
    private observer: PerformanceObserver;
    private metricsHistory: MetricEntry[] = [];
    private readonly MAX_HISTORY = 100;
    private readonly ALERT_THRESHOLD_MS = 1000;
    private readonly SUCCESS_RATE_THRESHOLD = 95;

    private constructor() {
        super();
        this.startTime = Date.now();
        
        // Initialize metrics
        this.metrics = {
            connections: 0,
            messageRate: 0,
            averageLatency: 0,
            errorRate: 0,
            activeTools: 0,
            memoryUsage: process.memoryUsage().heapUsed,
            cpuUsage: 0,
            uptime: 0
        };

        // Set up performance observer
        this.observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.name.startsWith('mcp-message-')) {
                    this.recordLatency(entry.duration);
                }
            });
        });
        this.observer.observe({ entryTypes: ['measure'] });

        // Start monitoring loops
        this.startMetricsCollection();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): MCPMonitor {
        if (!MCPMonitor.instance) {
            MCPMonitor.instance = new MCPMonitor();
        }
        return MCPMonitor.instance;
    }

    /**
     * Start collecting metrics
     */
    private startMetricsCollection() {
        // Update basic metrics every second
        setInterval(() => {
            this.updateMetrics();
        }, 1000);

        // Clean up old history data every minute
        setInterval(() => {
            this.cleanupHistory();
        }, 60 * 1000);

        // Monitor system resources every 5 seconds
        setInterval(() => {
            this.updateSystemMetrics();
        }, 5000);
    }

    /**
     * Update current metrics
     */
    private updateMetrics() {
        const now = Date.now();
        const window = 60 * 1000; // 1 minute window

        // Calculate message rate
        this.messageHistory = this.messageHistory.filter(t => (now - t) < window);
        this.metrics.messageRate = this.messageHistory.length / (window / 1000);

        // Calculate error rate
        this.errorHistory = this.errorHistory.filter(e => (now - e.timestamp) < window);
        const totalErrors = this.errorHistory.reduce((sum, e) => sum + e.count, 0);
        const totalMessages = this.messageHistory.length;
        this.metrics.errorRate = totalMessages > 0 ? totalErrors / totalMessages : 0;

        // Update uptime
        this.metrics.uptime = now - this.startTime;

        // Emit update event
        this.emit('metrics-updated', this.metrics);
    }

    /**
     * Update system resource metrics
     */
    private async updateSystemMetrics() {
        // Update memory usage
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage = memUsage.heapUsed;

        // Update CPU usage (percentage across all cores)
        const cpus = os.cpus();
        const totalCPU = cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total);
        }, 0);
        this.metrics.cpuUsage = totalCPU / cpus.length;
    }

    /**
     * Clean up historical data
     */
    private cleanupHistory() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Clean up alerts
        this.alerts = this.alerts.filter(alert => (now - alert.timestamp) < maxAge);

        // Clean up message history beyond 1 hour
        const messageWindow = 60 * 60 * 1000; // 1 hour
        this.messageHistory = this.messageHistory.filter(t => (now - t) < messageWindow);
    }

    /**
     * Record a new message
     */
    recordMessage() {
        this.messageHistory.push(Date.now());
        this.metrics.connections = this.getActiveConnections();
    }

    /**
     * Record message latency
     */
    private recordLatency(latency: number) {
        this.latencyHistory.push(latency);
        
        // Keep only last 1000 latency measurements
        if (this.latencyHistory.length > 1000) {
            this.latencyHistory.shift();
        }

        // Update average latency
        this.metrics.averageLatency = 
            this.latencyHistory.reduce((sum, val) => sum + val, 0) / 
            this.latencyHistory.length;
    }

    /**
     * Record an error
     */
    recordError(error: Error) {
        const timestamp = Date.now();
        
        // Add to error history
        const lastError = this.errorHistory[this.errorHistory.length - 1];
        if (lastError && (timestamp - lastError.timestamp) < 1000) {
            lastError.count++;
        } else {
            this.errorHistory.push({ timestamp, count: 1 });
        }

        // Add alert for serious errors
        if (error.name !== 'MCPWarning') {
            this.addAlert({
                type: 'error',
                message: error.message,
                timestamp
            });
        }
    }

    /**
     * Add a monitoring alert
     */
    addAlert(alert: MCPAlert) {
        this.alerts.push(alert);
        this.emit('alert', alert);

        // Keep max 100 most recent alerts
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }
    }

    /**
     * Get current number of active connections
     */
    private getActiveConnections(): number {
        // This would be implemented to check actual WebSocket connections
        // For now return a mock value
        return this.messageHistory.filter(t => (Date.now() - t) < 5000).length;
    }

    /**
     * Get current metrics
     */
    getMetrics(): MCPMetrics {
        return { ...this.metrics };
    }

    /**
     * Get current alerts
     */
    getAlerts(): MCPAlert[] {
        return [...this.alerts];
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.observer.disconnect();
        this.removeAllListeners();
    }

    public recordMetric(responseTime: number, success: boolean) {
        const now = Date.now();
        
        // Add new metric
        this.metricsHistory.push({
            timestamp: now,
            avgResponseTime: responseTime,
            successRate: success ? 100 : 0,
            requestCount: 1
        });

        // Maintain history limit
        if (this.metricsHistory.length > this.MAX_HISTORY) {
            this.metricsHistory.shift();
        }

        // Update alerts
        this.updateAlerts();
    }

    private updateAlerts() {
        this.alerts = [];
        
        // Calculate recent metrics
        const recentMetrics = this.metricsHistory.slice(-5);
        const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / recentMetrics.length;
        const successRate = recentMetrics.reduce((sum, m) => sum + m.successRate, 0) / recentMetrics.length;

        // Check thresholds
        if (avgResponseTime > this.ALERT_THRESHOLD_MS) {
            this.alerts.push({
                type: 'warning',
                message: `High average response time: ${Math.round(avgResponseTime)}ms`,
                timestamp: Date.now()
            });
        }

        if (successRate < this.SUCCESS_RATE_THRESHOLD) {
            this.alerts.push({
                type: 'warning',
                message: `Low success rate: ${Math.round(successRate)}%`,
                timestamp: Date.now()
            });
        }
    }

    public getLatestMetrics(): MetricEntry {
        if (this.metricsHistory.length === 0) {
            return {
                timestamp: Date.now(),
                avgResponseTime: 0,
                successRate: 100,
                requestCount: 0
            };
        }
        return this.metricsHistory[this.metricsHistory.length - 1];
    }

    public getMetricsHistory(): MetricEntry[] {
        return [...this.metricsHistory];
    }

    public clearMetrics() {
        this.metricsHistory = [];
        this.alerts = [];
    }
}