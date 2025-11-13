"use strict";
/**
 * Advanced Performance Profiler for MCP Components
 *
 * This module provides comprehensive profiling capabilities including
 * CPU profiling, memory analysis, I/O monitoring, and optimization recommendations.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedProfiler = void 0;
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// ============================================================================
// Advanced Performance Profiler
// ============================================================================
class AdvancedProfiler extends events_1.EventEmitter {
    options;
    isRunning = false;
    sessionId = '';
    startTime = 0;
    endTime = 0;
    // Profiling data
    cpuSamples = [];
    memorySnapshots = [];
    ioOperations = [];
    networkRequests = [];
    // Performance observers
    performanceObserver;
    samplingTimer;
    constructor(options = {}) {
        super();
        this.options = {
            enableCPUProfiling: true,
            enableMemoryProfiling: true,
            enableIOProfiling: true,
            enableNetworkProfiling: true,
            samplingInterval: 100,
            maxSamples: 10000,
            outputDirectory: './profiler-output',
            ...options
        };
    }
    async startProfiling(sessionId) {
        if (this.isRunning) {
            throw new Error('Profiler is already running');
        }
        this.sessionId = sessionId || `profile-${Date.now()}`;
        this.startTime = perf_hooks_1.performance.now();
        this.isRunning = true;
        // Clear previous data
        this.cpuSamples = [];
        this.memorySnapshots = [];
        this.ioOperations = [];
        this.networkRequests = [];
        // Setup performance observers
        if (this.options.enableCPUProfiling || this.options.enableIOProfiling || this.options.enableNetworkProfiling) {
            this.setupPerformanceObserver();
        }
        // Start memory profiling
        if (this.options.enableMemoryProfiling) {
            this.startMemoryProfiling();
        }
        // Start CPU sampling
        if (this.options.enableCPUProfiling) {
            this.startCPUSampling();
        }
        this.emit('profilingStarted', { sessionId: this.sessionId });
        return this.sessionId;
    }
    async stopProfiling() {
        if (!this.isRunning) {
            throw new Error('Profiler is not running');
        }
        this.endTime = perf_hooks_1.performance.now();
        this.isRunning = false;
        // Stop sampling
        if (this.samplingTimer) {
            clearInterval(this.samplingTimer);
            this.samplingTimer = undefined;
        }
        // Stop performance observer
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = undefined;
        }
        // Generate report
        const report = await this.generateReport();
        // Save report to file
        if (this.options.outputDirectory) {
            await this.saveReport(report);
        }
        this.emit('profilingStopped', { sessionId: this.sessionId, report });
        return report;
    }
    setupPerformanceObserver() {
        this.performanceObserver = new perf_hooks_1.PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
                if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
                    // CPU profiling data
                    if (this.options.enableCPUProfiling) {
                        this.cpuSamples.push({
                            timestamp: entry.startTime,
                            name: entry.name,
                            duration: entry.duration,
                            stackTrace: this.captureStackTrace()
                        });
                    }
                }
                // Network profiling
                if (entry.entryType === 'resource' && this.options.enableNetworkProfiling) {
                    this.networkRequests.push({
                        method: 'GET', // Default, would need more sophisticated detection
                        url: entry.name,
                        duration: entry.duration,
                        size: entry.transferSize || 0,
                        status: 200, // Default, would need more sophisticated detection
                        timestamp: entry.startTime
                    });
                }
            }
        });
        this.performanceObserver.observe({
            entryTypes: ['measure', 'navigation', 'resource', 'paint']
        });
    }
    startMemoryProfiling() {
        const sampleMemory = () => {
            if (!this.isRunning)
                return;
            const usage = process.memoryUsage();
            this.memorySnapshots.push({
                timestamp: perf_hooks_1.performance.now(),
                usage,
                heapSnapshot: this.options.enableMemoryProfiling ? this.captureHeapSnapshot() : null
            });
            if (this.memorySnapshots.length > (this.options.maxSamples || 10000)) {
                this.memorySnapshots.shift();
            }
        };
        // Initial sample
        sampleMemory();
        // Setup interval sampling
        this.samplingTimer = setInterval(sampleMemory, this.options.samplingInterval || 100);
    }
    startCPUSampling() {
        // CPU profiling is handled by the performance observer
        // This method can be extended for more sophisticated CPU profiling
    }
    captureStackTrace() {
        const stack = new Error().stack;
        if (!stack)
            return [];
        return stack
            .split('\n')
            .slice(2) // Remove Error and this function
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    captureHeapSnapshot() {
        // Simplified heap snapshot - in a real implementation,
        // you would use v8.getHeapSnapshot() or similar
        return {
            timestamp: Date.now(),
            totalSize: process.memoryUsage().heapUsed,
            // Additional heap analysis would go here
        };
    }
    async generateReport() {
        const duration = this.endTime - this.startTime;
        const report = {
            sessionId: this.sessionId,
            startTime: this.startTime,
            endTime: this.endTime,
            duration,
            recommendations: [],
            score: {
                overall: 0,
                cpu: 0,
                memory: 0,
                io: 0,
                network: 0
            }
        };
        // Generate CPU profile
        if (this.options.enableCPUProfiling && this.cpuSamples.length > 0) {
            report.cpu = this.generateCPUProfile();
            report.score.cpu = this.calculateCPUScore(report.cpu);
        }
        // Generate memory profile
        if (this.options.enableMemoryProfiling && this.memorySnapshots.length > 0) {
            report.memory = this.generateMemoryProfile();
            report.score.memory = this.calculateMemoryScore(report.memory);
        }
        // Generate I/O profile
        if (this.options.enableIOProfiling && this.ioOperations.length > 0) {
            report.io = this.generateIOProfile();
            report.score.io = this.calculateIOScore(report.io);
        }
        // Generate network profile
        if (this.options.enableNetworkProfiling && this.networkRequests.length > 0) {
            report.network = this.generateNetworkProfile();
            report.score.network = this.calculateNetworkScore(report.network);
        }
        // Generate recommendations
        report.recommendations = this.generateRecommendations(report);
        // Calculate overall score
        const scores = [report.score.cpu, report.score.memory, report.score.io, report.score.network];
        const validScores = scores.filter(score => score > 0);
        report.score.overall = validScores.length > 0
            ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
            : 0;
        return report;
    }
    generateCPUProfile() {
        const totalTime = this.cpuSamples.reduce((sum, sample) => sum + sample.duration, 0);
        // Group samples by function/location
        const functionMap = new Map();
        for (const sample of this.cpuSamples) {
            const key = sample.stackTrace[0] || 'unknown';
            const existing = functionMap.get(key) || { selfTime: 0, totalTime: 0, count: 0 };
            existing.selfTime += sample.duration;
            existing.totalTime += sample.duration;
            existing.count += 1;
            functionMap.set(key, existing);
        }
        // Generate hotspots
        const hotspots = Array.from(functionMap.entries())
            .map(([key, data]) => ({
            function: this.extractFunctionName(key),
            file: this.extractFileName(key),
            line: this.extractLineNumber(key),
            selfTime: data.selfTime,
            totalTime: data.totalTime,
            percentage: (data.totalTime / totalTime) * 100
        }))
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 20); // Top 20 hotspots
        return {
            samples: this.cpuSamples,
            totalTime,
            hotspots
        };
    }
    generateMemoryProfile() {
        const leaks = [];
        const recommendations = [];
        // Analyze memory growth
        if (this.memorySnapshots.length > 1) {
            const first = this.memorySnapshots[0];
            const last = this.memorySnapshots[this.memorySnapshots.length - 1];
            const heapGrowth = last.usage.heapUsed - first.usage.heapUsed;
            const rssGrowth = last.usage.rss - first.usage.rss;
            if (heapGrowth > 50 * 1024 * 1024) { // 50MB growth
                recommendations.push('Significant heap growth detected. Consider implementing object pooling or reviewing object lifecycle management.');
            }
            if (rssGrowth > 100 * 1024 * 1024) { // 100MB growth
                recommendations.push('High RSS growth detected. Review memory allocation patterns and consider using streams for large data processing.');
            }
        }
        // Detect potential memory leaks (simplified)
        const recentSnapshots = this.memorySnapshots.slice(-10);
        if (recentSnapshots.length >= 5) {
            const trend = this.calculateMemoryTrend(recentSnapshots);
            if (trend > 1024 * 1024) { // 1MB per sample trend
                leaks.push({
                    type: 'heap-growth',
                    size: trend,
                    location: 'unknown',
                    retainedSize: trend * recentSnapshots.length
                });
                recommendations.push('Potential memory leak detected in heap usage. Review object retention and cleanup.');
            }
        }
        return {
            snapshots: this.memorySnapshots,
            leaks,
            recommendations
        };
    }
    generateIOProfile() {
        const totalOperations = this.ioOperations.length;
        const totalBytes = this.ioOperations.reduce((sum, op) => sum + op.size, 0);
        const averageDuration = totalOperations > 0
            ? this.ioOperations.reduce((sum, op) => sum + op.duration, 0) / totalOperations
            : 0;
        const slowestOperations = [...this.ioOperations]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)
            .map(op => ({
            type: op.type,
            path: op.path,
            duration: op.duration
        }));
        return {
            operations: this.ioOperations,
            summary: {
                totalOperations,
                totalBytes,
                averageDuration,
                slowestOperations
            }
        };
    }
    generateNetworkProfile() {
        const totalRequests = this.networkRequests.length;
        const totalBytes = this.networkRequests.reduce((sum, req) => sum + req.size, 0);
        const averageDuration = totalRequests > 0
            ? this.networkRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests
            : 0;
        const errorCount = this.networkRequests.filter(req => req.status >= 400).length;
        const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
        const slowestRequests = [...this.networkRequests]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)
            .map(req => ({
            url: req.url,
            duration: req.duration
        }));
        return {
            requests: this.networkRequests,
            summary: {
                totalRequests,
                totalBytes,
                averageDuration,
                errorRate,
                slowestRequests
            }
        };
    }
    calculateCPUScore(profile) {
        // Score based on hotspot distribution and total time
        const topHotspotPercentage = profile.hotspots[0]?.percentage || 0;
        if (topHotspotPercentage > 50)
            return 30; // Poor - one function dominates
        if (topHotspotPercentage > 30)
            return 60; // Fair - some concentration
        if (topHotspotPercentage > 15)
            return 80; // Good - reasonable distribution
        return 95; // Excellent - well distributed
    }
    calculateMemoryScore(profile) {
        const leakCount = profile.leaks.length;
        const recommendationCount = profile.recommendations.length;
        if (leakCount > 5 || recommendationCount > 3)
            return 20; // Poor
        if (leakCount > 2 || recommendationCount > 1)
            return 60; // Fair
        if (leakCount > 0 || recommendationCount > 0)
            return 80; // Good
        return 95; // Excellent
    }
    calculateIOScore(profile) {
        const avgDuration = profile.summary.averageDuration;
        if (avgDuration > 100)
            return 30; // Poor - slow I/O
        if (avgDuration > 50)
            return 60; // Fair
        if (avgDuration > 20)
            return 80; // Good
        return 95; // Excellent
    }
    calculateNetworkScore(profile) {
        const errorRate = profile.summary.errorRate;
        const avgDuration = profile.summary.averageDuration;
        if (errorRate > 10 || avgDuration > 5000)
            return 20; // Poor
        if (errorRate > 5 || avgDuration > 2000)
            return 50; // Fair
        if (errorRate > 1 || avgDuration > 1000)
            return 75; // Good
        return 95; // Excellent
    }
    generateRecommendations(report) {
        const recommendations = [];
        // CPU recommendations
        if (report.cpu && report.score.cpu < 70) {
            const topHotspot = report.cpu.hotspots[0];
            if (topHotspot && topHotspot.percentage > 30) {
                recommendations.push(`Optimize ${topHotspot.function} - it consumes ${topHotspot.percentage.toFixed(1)}% of CPU time`);
            }
        }
        // Memory recommendations
        if (report.memory) {
            recommendations.push(...report.memory.recommendations);
        }
        // I/O recommendations
        if (report.io && report.score.io < 70) {
            recommendations.push('Consider implementing I/O caching or batching to improve performance');
            if (report.io.summary.slowestOperations.length > 0) {
                const slowest = report.io.summary.slowestOperations[0];
                recommendations.push(`Optimize I/O operation: ${slowest.type} on ${slowest.path} (${slowest.duration.toFixed(2)}ms)`);
            }
        }
        // Network recommendations
        if (report.network && report.score.network < 70) {
            if (report.network.summary.errorRate > 5) {
                recommendations.push(`High network error rate (${report.network.summary.errorRate.toFixed(1)}%) - implement retry logic and error handling`);
            }
            if (report.network.summary.averageDuration > 2000) {
                recommendations.push('Network requests are slow - consider connection pooling, caching, or CDN usage');
            }
        }
        return recommendations;
    }
    calculateMemoryTrend(snapshots) {
        if (snapshots.length < 2)
            return 0;
        const values = snapshots.map(s => s.usage.heapUsed);
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }
    extractFunctionName(stackLine) {
        const match = stackLine.match(/at\s+([^\s]+)/);
        return match ? match[1] : 'unknown';
    }
    extractFileName(stackLine) {
        const match = stackLine.match(/\(([^:]+):/);
        return match ? path.basename(match[1]) : 'unknown';
    }
    extractLineNumber(stackLine) {
        const match = stackLine.match(/:(\d+):/);
        return match ? parseInt(match[1], 10) : 0;
    }
    async saveReport(report) {
        if (!this.options.outputDirectory)
            return;
        try {
            await fs.mkdir(this.options.outputDirectory, { recursive: true });
            const reportPath = path.join(this.options.outputDirectory, `${report.sessionId}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            const htmlReport = this.generateHTMLReport(report);
            const htmlPath = path.join(this.options.outputDirectory, `${report.sessionId}.html`);
            await fs.writeFile(htmlPath, htmlReport);
            this.emit('reportSaved', { sessionId: report.sessionId, reportPath, htmlPath });
        }
        catch (error) {
            this.emit('reportSaveError', { sessionId: report.sessionId, error });
        }
    }
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Profile Report - ${report.sessionId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .score { display: inline-block; padding: 10px; margin: 5px; border-radius: 5px; color: white; }
        .score.excellent { background: #4CAF50; }
        .score.good { background: #8BC34A; }
        .score.fair { background: #FF9800; }
        .score.poor { background: #F44336; }
        .section { margin: 20px 0; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Profile Report</h1>
        <p><strong>Session:</strong> ${report.sessionId}</p>
        <p><strong>Duration:</strong> ${(report.duration / 1000).toFixed(2)} seconds</p>
        <p><strong>Overall Score:</strong> 
            <span class="score ${this.getScoreClass(report.score.overall)}">${report.score.overall.toFixed(0)}/100</span>
        </p>
    </div>

    <div class="section">
        <h2>Component Scores</h2>
        ${report.cpu ? `<span class="score ${this.getScoreClass(report.score.cpu)}">CPU: ${report.score.cpu.toFixed(0)}</span>` : ''}
        ${report.memory ? `<span class="score ${this.getScoreClass(report.score.memory)}">Memory: ${report.score.memory.toFixed(0)}</span>` : ''}
        ${report.io ? `<span class="score ${this.getScoreClass(report.score.io)}">I/O: ${report.score.io.toFixed(0)}</span>` : ''}
        ${report.network ? `<span class="score ${this.getScoreClass(report.score.network)}">Network: ${report.score.network.toFixed(0)}</span>` : ''}
    </div>

    ${report.recommendations.length > 0 ? `
    <div class="section recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${report.cpu ? `
    <div class="section">
        <h2>CPU Hotspots</h2>
        <table>
            <tr><th>Function</th><th>File</th><th>Time (ms)</th><th>Percentage</th></tr>
            ${report.cpu.hotspots.slice(0, 10).map(hotspot => `
                <tr>
                    <td>${hotspot.function}</td>
                    <td>${hotspot.file}:${hotspot.line}</td>
                    <td>${hotspot.totalTime.toFixed(2)}</td>
                    <td>${hotspot.percentage.toFixed(1)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h2>Raw Data</h2>
        <pre>${JSON.stringify(report, null, 2)}</pre>
    </div>
</body>
</html>
    `;
    }
    getScoreClass(score) {
        if (score >= 90)
            return 'excellent';
        if (score >= 75)
            return 'good';
        if (score >= 50)
            return 'fair';
        return 'poor';
    }
    isProfilingActive() {
        return this.isRunning;
    }
    getCurrentSessionId() {
        return this.sessionId;
    }
}
exports.AdvancedProfiler = AdvancedProfiler;
// ============================================================================
// Exports
// ============================================================================
// Export statement removed - class is already exported in declaration
//# sourceMappingURL=profiler.js.map