"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceAnalyzer = exports.TraceEntrySchema = void 0;
const zod_1 = require("zod");
exports.TraceEntrySchema = zod_1.z.object({
    timestamp: zod_1.z.number(),
    agentId: zod_1.z.string(),
    action: zod_1.z.string(),
    durationMs: zod_1.z.number().optional(),
    success: zod_1.z.boolean().optional(),
    errorType: zod_1.z.string().optional(),
    errorMessage: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
class TraceAnalyzer {
    constructor() {
        this.entries = [];
    }
    loadTraces(entries) {
        this.entries = entries;
    }
    addEntry(entry) {
        this.entries.push(entry);
    }
    computeMetrics() {
        const total = this.entries.length;
        if (total === 0) {
            return {
                totalEntries: 0,
                successRate: 0,
                errorRate: 0,
                avgDurationMs: 0,
                p95DurationMs: 0,
                errorCategories: {},
                agentBreakdown: {},
                timeRange: null,
            };
        }
        const successes = this.entries.filter(e => e.success === true).length;
        const errors = this.entries.filter(e => e.success === false || e.errorType).length;
        const withDuration = this.entries.filter(e => e.durationMs !== undefined);
        const durations = withDuration.map(e => e.durationMs).sort((a, b) => a - b);
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        const p95Index = Math.floor(durations.length * 0.95);
        const p95Duration = durations.length > 0 ? durations[p95Index] ?? durations[durations.length - 1] : 0;
        const errorCategories = {};
        for (const entry of this.entries) {
            if (entry.errorType) {
                errorCategories[entry.errorType] = (errorCategories[entry.errorType] ?? 0) + 1;
            }
        }
        const agentBreakdown = {};
        for (const entry of this.entries) {
            if (!agentBreakdown[entry.agentId]) {
                agentBreakdown[entry.agentId] = { total: 0, errors: 0, avgDuration: 0 };
            }
            const stats = agentBreakdown[entry.agentId];
            stats.total++;
            if (entry.success === false || entry.errorType) {
                stats.errors++;
            }
        }
        const agentDurations = {};
        for (const entry of this.entries) {
            if (entry.durationMs !== undefined) {
                if (!agentDurations[entry.agentId])
                    agentDurations[entry.agentId] = [];
                agentDurations[entry.agentId].push(entry.durationMs);
            }
        }
        for (const [agentId, durs] of Object.entries(agentDurations)) {
            if (agentBreakdown[agentId]) {
                agentBreakdown[agentId].avgDuration = durs.reduce((a, b) => a + b, 0) / durs.length;
            }
        }
        const timestamps = this.entries.map(e => e.timestamp).sort((a, b) => a - b);
        return {
            totalEntries: total,
            successRate: successes / total,
            errorRate: errors / total,
            avgDurationMs: avgDuration,
            p95DurationMs: p95Duration,
            errorCategories,
            agentBreakdown,
            timeRange: timestamps.length > 0 ? { start: timestamps[0], end: timestamps[timestamps.length - 1] } : null,
        };
    }
    identifyIssues() {
        const issues = [];
        const timeoutEntries = this.entries.filter(e => e.errorType === 'timeout');
        if (timeoutEntries.length > 0) {
            issues.push({
                category: 'timeout',
                count: timeoutEntries.length,
                severity: timeoutEntries.length > 10 ? 'critical' : 'high',
                description: `${timeoutEntries.length} timeout errors detected across ${new Set(timeoutEntries.map(e => e.agentId)).size} agents`,
                affectedAgents: new Set(timeoutEntries.map(e => e.agentId)),
                examples: timeoutEntries.slice(0, 5),
            });
        }
        const rateLimitEntries = this.entries.filter(e => e.errorType === 'rate_limit');
        if (rateLimitEntries.length > 0) {
            issues.push({
                category: 'rate_limit',
                count: rateLimitEntries.length,
                severity: 'medium',
                description: `${rateLimitEntries.length} rate limit errors — consider backoff or request reduction`,
                affectedAgents: new Set(rateLimitEntries.map(e => e.agentId)),
                examples: rateLimitEntries.slice(0, 5),
            });
        }
        const authEntries = this.entries.filter(e => e.errorType === 'auth_failure');
        if (authEntries.length > 0) {
            issues.push({
                category: 'auth_failure',
                count: authEntries.length,
                severity: 'critical',
                description: `${authEntries.length} authentication failures — check API keys and credentials`,
                affectedAgents: new Set(authEntries.map(e => e.agentId)),
                examples: authEntries.slice(0, 5),
            });
        }
        const slowEntries = this.entries.filter(e => e.durationMs !== undefined && e.durationMs > 30000);
        if (slowEntries.length > 0) {
            issues.push({
                category: 'slow_execution',
                count: slowEntries.length,
                severity: slowEntries.length > 5 ? 'high' : 'medium',
                description: `${slowEntries.length} actions exceeded 30s threshold (max: ${Math.max(...slowEntries.map(e => e.durationMs))}ms)`,
                affectedAgents: new Set(slowEntries.map(e => e.agentId)),
                examples: slowEntries.slice(0, 5),
            });
        }
        const metrics = this.computeMetrics();
        for (const [agentId, stats] of Object.entries(metrics.agentBreakdown)) {
            if (stats.total > 5 && stats.errors / stats.total > 0.5) {
                issues.push({
                    category: 'high_error_agent',
                    count: stats.errors,
                    severity: 'high',
                    description: `Agent ${agentId} has ${(stats.errors / stats.total * 100).toFixed(1)}% error rate (${stats.errors}/${stats.total})`,
                    affectedAgents: new Set([agentId]),
                    examples: this.entries.filter(e => e.agentId === agentId && (e.success === false || e.errorType)).slice(0, 3),
                });
            }
        }
        return issues.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }
    generateEvaluationPlan() {
        const issues = this.identifyIssues();
        const focusAreas = [...new Set(issues.map(i => i.category))];
        const metrics = [
            'success_rate',
            'error_rate',
            'p95_latency_ms',
            'timeout_rate',
            'rate_limit_rate',
            'auth_failure_rate',
        ];
        const thresholds = {
            min_success_rate: 0.95,
            max_error_rate: 0.05,
            max_p95_latency_ms: 30000,
            max_timeout_rate: 0.01,
            max_rate_limit_rate: 0.02,
            max_auth_failure_rate: 0,
        };
        for (const issue of issues) {
            if (issue.severity === 'critical' || issue.severity === 'high') {
                focusAreas.push(`investigate_${issue.category}`);
            }
        }
        return { focusAreas: [...new Set(focusAreas)], metrics, thresholds };
    }
    clear() {
        this.entries = [];
    }
}
exports.TraceAnalyzer = TraceAnalyzer;
//# sourceMappingURL=traceAnalyzer.js.map