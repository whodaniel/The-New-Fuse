"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RooCoderMonitor = void 0;
const logging_1 = require("../core/logging");
const telemetry_1 = require("../core/telemetry");
class RooCoderMonitor {
    constructor() {
        this.logger = logging_1.Logger.getInstance();
        this.telemetry = telemetry_1.TelemetryService.getInstance();
        this.metrics = {
            toolUsage: new Map(),
            responseTime: [],
            errorCount: 0,
            activeAgents: []
        };
    }
    static getInstance() {
        if (!RooCoderMonitor.instance) {
            RooCoderMonitor.instance = new RooCoderMonitor();
        }
        return RooCoderMonitor.instance;
    }
    trackToolUsage(toolId, executionTime) {
        const currentCount = this.metrics.toolUsage.get(toolId) || 0;
        this.metrics.toolUsage.set(toolId, currentCount + 1);
        this.metrics.responseTime.push(executionTime);
        this.telemetry.trackEvent('tool_execution', {
            toolId,
            executionTime: executionTime.toString()
        });
    }
    trackError(error) {
        this.metrics.errorCount++;
        this.telemetry.trackError(error);
    }
    updateActiveAgents(agents) {
        this.metrics.activeAgents = agents;
        this.telemetry.trackEvent('active_agents_updated', {
            count: agents.length.toString(),
            agents: agents.join(',')
        });
    }
    async getMetricsReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            summary: {
                totalToolExecutions: Array.from(this.metrics.toolUsage.values())
                    .reduce((a, b) => a + b, 0),
                averageResponseTime: this.metrics.responseTime.length > 0
                    ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
                    : 0,
                errorRate: this.metrics.errorCount
            }
        };
        return JSON.stringify(report, null, 2);
    }
}
exports.RooCoderMonitor = RooCoderMonitor;
//# sourceMappingURL=roo-coder-monitor.js.map