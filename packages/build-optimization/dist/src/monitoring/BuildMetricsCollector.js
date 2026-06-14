/**
 * Build metrics collection and reporting system
 */
import { BaseMetricsCollector, Logger, } from '@the-new-fuse/core-monitoring';
/**
 * Build metrics collector implementation
 */
export class BuildMetricsCollector extends BaseMetricsCollector {
    isCollecting = false;
    buildMetrics = {
        totalBuildTime: 0,
        peakMemoryUsage: 0,
        averageMemoryUsage: 0,
        stagesExecuted: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
        memoryHistory: [],
        startTime: Date.now(),
        endTime: 0,
        memorySnapshots: [],
        events: [],
        stageMetrics: [],
        performanceStats: {
            avgBuildTimePerPackage: 0,
            memoryEfficiencyScore: 0,
            concurrencyUtilization: 0,
            cleanupTime: 0,
            memoryViolations: 0,
        },
    };
    currentStage = null;
    memoryMonitoringInterval = null;
    monitoringIntervalMs;
    constructor(monitoringInterval = 1000) {
        const config = {
            interval: monitoringInterval,
            retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
            storage: { type: 'memory' },
        };
        super(config, new Logger('BuildMetricsCollector'));
        this.monitoringIntervalMs = monitoringInterval;
        this.resetMetrics();
    }
    /**
     * Start collecting metrics (implements IMetricsCollector interface)
     */
    async start() {
        await super.start();
        this.startCollection();
    }
    /**
     * Stop collecting metrics (implements IMetricsCollector interface)
     */
    async stop() {
        this.stopCollection();
        await super.stop();
    }
    /**
     * Start collecting build metrics
     */
    startCollection() {
        if (this.isCollecting) {
            return;
        }
        this.isCollecting = true;
        this.resetMetrics();
        this.buildMetrics.startTime = Date.now();
        // Start memory monitoring
        this.startMemoryMonitoring();
        // Record build start event
        this.recordEvent({
            type: 'build-started',
            timestamp: Date.now(),
            payload: { startTime: this.buildMetrics.startTime },
        });
        this.emit('collection-started');
    }
    /**
     * Stop collecting build metrics
     */
    stopCollection() {
        if (!this.isCollecting) {
            return;
        }
        this.isCollecting = false;
        this.buildMetrics.endTime = Date.now();
        this.buildMetrics.totalBuildTime = this.buildMetrics.endTime - this.buildMetrics.startTime;
        // Stop memory monitoring
        this.stopMemoryMonitoring();
        // Finalize current stage if active
        if (this.currentStage) {
            this.finishCurrentStage(true);
        }
        // Calculate final performance statistics
        this.calculatePerformanceStats();
        // Record build completion event
        this.recordEvent({
            type: 'build-completed',
            timestamp: Date.now(),
            payload: {
                duration: this.buildMetrics.totalBuildTime,
                success: this.buildMetrics.failedBuilds === 0,
            },
        });
        this.emit('collection-stopped', this.buildMetrics);
    }
    /**
     * Record a build event
     */
    recordEvent(event) {
        if (!this.isCollecting) {
            return;
        }
        this.buildMetrics.events.push(event);
        // Handle specific event types
        switch (event.type) {
            case 'stage-started':
                this.startStage(event.payload);
                break;
            case 'stage-completed':
                this.finishCurrentStage(true);
                break;
            case 'build-failed':
                this.buildMetrics.failedBuilds++;
                this.finishCurrentStage(false, event.payload.error);
                break;
            case 'memory-threshold-exceeded':
                this.buildMetrics.performanceStats.memoryViolations++;
                break;
            case 'concurrency-adjusted':
                // Track concurrency changes for utilization calculation
                break;
        }
        this.emit('event-recorded', event);
    }
    /**
     * Get collected metrics (implements base class abstract method)
     */
    getCurrentMetrics() {
        // Return a deep copy to prevent external modifications
        return JSON.parse(JSON.stringify(this.buildMetrics));
    }
    /**
     * Get collected metrics (legacy method for backward compatibility)
     */
    getMetrics() {
        return this.getCurrentMetrics();
    }
    /**
     * Collect metrics (implements base class abstract method)
     */
    collectMetrics() {
        // Update average memory usage if we have snapshots
        if (this.buildMetrics.memorySnapshots.length > 0) {
            const totalMemory = this.buildMetrics.memorySnapshots.reduce((sum, snapshot) => sum + snapshot.current, 0);
            this.buildMetrics.averageMemoryUsage = totalMemory / this.buildMetrics.memorySnapshots.length;
        }
        // Emit metrics collected event
        this.emit('metricsCollected', this.buildMetrics);
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.buildMetrics = {
            totalBuildTime: 0,
            peakMemoryUsage: 0,
            averageMemoryUsage: 0,
            stagesExecuted: 0,
            successfulBuilds: 0,
            failedBuilds: 0,
            memoryHistory: [],
            startTime: 0,
            endTime: 0,
            memorySnapshots: [],
            events: [],
            stageMetrics: [],
            performanceStats: {
                avgBuildTimePerPackage: 0,
                memoryEfficiencyScore: 0,
                concurrencyUtilization: 0,
                cleanupTime: 0,
                memoryViolations: 0,
            },
        };
        this.currentStage = null;
    }
    /**
     * Record memory usage snapshot
     */
    recordMemorySnapshot(usage) {
        if (!this.isCollecting) {
            return;
        }
        this.buildMetrics.memorySnapshots.push(usage);
        this.buildMetrics.memoryHistory.push(usage);
        // Update peak memory usage
        if (usage.current > this.buildMetrics.peakMemoryUsage) {
            this.buildMetrics.peakMemoryUsage = usage.current;
        }
        // Update current stage peak memory if active
        if (this.currentStage && usage.current > this.currentStage.peakMemoryUsage) {
            this.currentStage.peakMemoryUsage = usage.current;
        }
    }
    /**
     * Record successful package build
     */
    recordSuccessfulBuild(packageName, duration) {
        if (!this.isCollecting) {
            return;
        }
        this.buildMetrics.successfulBuilds++;
        if (this.currentStage) {
            this.currentStage.packages.push(packageName);
        }
        this.recordEvent({
            type: 'build-completed',
            timestamp: Date.now(),
            payload: { packageName, duration, success: true },
        });
    }
    /**
     * Record failed package build
     */
    recordFailedBuild(packageName, error) {
        if (!this.isCollecting) {
            return;
        }
        // Don't increment here, let recordEvent handle it
        this.recordEvent({
            type: 'build-failed',
            timestamp: Date.now(),
            payload: { packageName, error, success: false },
        });
    }
    /**
     * Generate build report
     */
    generateReport() {
        const metrics = this.getMetrics();
        const duration = metrics.totalBuildTime;
        const durationSeconds = (duration / 1000).toFixed(2);
        const peakMemoryMB = metrics.peakMemoryUsage.toFixed(2);
        const avgMemoryMB = metrics.averageMemoryUsage.toFixed(2);
        const successRate = metrics.successfulBuilds + metrics.failedBuilds > 0
            ? ((metrics.successfulBuilds / (metrics.successfulBuilds + metrics.failedBuilds)) *
                100).toFixed(1)
            : '0';
        let report = `
Build Metrics Report
===================

Duration: ${durationSeconds}s
Peak Memory Usage: ${peakMemoryMB} MB
Average Memory Usage: ${avgMemoryMB} MB
Stages Executed: ${metrics.stagesExecuted}
Successful Builds: ${metrics.successfulBuilds}
Failed Builds: ${metrics.failedBuilds}
Success Rate: ${successRate}%

Performance Statistics:
- Average Build Time per Package: ${metrics.performanceStats.avgBuildTimePerPackage.toFixed(2)}ms
- Memory Efficiency Score: ${metrics.performanceStats.memoryEfficiencyScore.toFixed(1)}/100
- Concurrency Utilization: ${metrics.performanceStats.concurrencyUtilization.toFixed(1)}%
- Memory Violations: ${metrics.performanceStats.memoryViolations}
- Cleanup Time: ${metrics.performanceStats.cleanupTime.toFixed(2)}ms

Stage Breakdown:
`;
        metrics.stageMetrics.forEach((stage, index) => {
            const stageDuration = (stage.duration / 1000).toFixed(2);
            const stageMemory = stage.peakMemoryUsage.toFixed(2);
            const stageStatus = stage.success ? '✓' : '✗';
            report += `  ${index + 1}. ${stage.stageId} ${stageStatus}\n`;
            report += `     Duration: ${stageDuration}s, Peak Memory: ${stageMemory} MB\n`;
            report += `     Packages: ${stage.packages.join(', ')}\n`;
            if (stage.error) {
                report += `     Error: ${stage.error}\n`;
            }
            report += '\n';
        });
        return report;
    }
    /**
     * Start monitoring memory usage
     */
    startMemoryMonitoring() {
        this.memoryMonitoringInterval = setInterval(() => {
            const memUsage = process.memoryUsage();
            const usage = {
                current: Math.round(memUsage.heapUsed / 1024 / 1024),
                peak: Math.round(memUsage.heapUsed / 1024 / 1024),
                percentage: 0, // Will be calculated by memory monitor
                timestamp: Date.now(),
            };
            this.recordMemorySnapshot(usage);
        }, this.monitoringIntervalMs);
    }
    /**
     * Stop monitoring memory usage
     */
    stopMemoryMonitoring() {
        if (this.memoryMonitoringInterval) {
            clearInterval(this.memoryMonitoringInterval);
            this.memoryMonitoringInterval = null;
        }
    }
    /**
     * Start a new build stage
     */
    startStage(payload) {
        // Finish current stage if active
        if (this.currentStage) {
            this.finishCurrentStage(true);
        }
        this.currentStage = {
            stageId: payload.stageId || `stage-${this.buildMetrics.stagesExecuted + 1}`,
            startTime: Date.now(),
            endTime: 0,
            duration: 0,
            packages: [],
            peakMemoryUsage: 0,
            success: false,
        };
    }
    /**
     * Finish the current build stage
     */
    finishCurrentStage(success, error) {
        if (!this.currentStage) {
            return;
        }
        this.currentStage.endTime = Date.now();
        this.currentStage.duration = this.currentStage.endTime - this.currentStage.startTime;
        this.currentStage.success = success;
        if (error) {
            this.currentStage.error = error;
        }
        this.buildMetrics.stageMetrics.push(this.currentStage);
        this.buildMetrics.stagesExecuted++;
        this.currentStage = null;
    }
    /**
     * Calculate performance statistics
     */
    calculatePerformanceStats() {
        const totalPackages = this.buildMetrics.successfulBuilds + this.buildMetrics.failedBuilds;
        // Average build time per package
        if (totalPackages > 0) {
            this.buildMetrics.performanceStats.avgBuildTimePerPackage =
                this.buildMetrics.totalBuildTime / totalPackages;
        }
        // Calculate average memory usage
        if (this.buildMetrics.memorySnapshots.length > 0) {
            const totalMemory = this.buildMetrics.memorySnapshots.reduce((sum, snapshot) => sum + snapshot.current, 0);
            this.buildMetrics.averageMemoryUsage = totalMemory / this.buildMetrics.memorySnapshots.length;
        }
        // Memory efficiency score (lower memory usage = higher score)
        if (this.buildMetrics.peakMemoryUsage > 0) {
            const efficiency = Math.max(0, 100 - (this.buildMetrics.peakMemoryUsage / 1000) * 10);
            this.buildMetrics.performanceStats.memoryEfficiencyScore = Math.min(100, efficiency);
        }
        // Calculate cleanup time from events
        const cleanupEvents = this.buildMetrics.events.filter((e) => e.payload && e.payload.type === 'cleanup');
        this.buildMetrics.performanceStats.cleanupTime = cleanupEvents.reduce((sum, event) => sum + (event.payload.duration || 0), 0);
        // Concurrency utilization (simplified calculation)
        this.buildMetrics.performanceStats.concurrencyUtilization =
            this.buildMetrics.stagesExecuted > 0 ? 75 : 0; // Placeholder calculation
    }
}
//# sourceMappingURL=BuildMetricsCollector.js.map