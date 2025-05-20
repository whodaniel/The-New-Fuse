import { getLogger, ExtensionLogger } from '../src/core/logging.js';
import { TelemetryService } from '../src/core/telemetry.js';

interface MonitoringMetrics {
    toolUsage: Map<string, number>;
    responseTime: number[];  
    errorCount: number;
    activeAgents: string[];
}

export class RooCoderMonitor {
    private static instance: RooCoderMonitor;
    private metrics: MonitoringMetrics;
    private logger: ExtensionLogger;
    private telemetry: TelemetryService;

    private constructor() {
        this.logger = getLogger();
        this.telemetry = TelemetryService.getInstance();
        this.metrics = {
            toolUsage: new Map(),
            responseTime: [],
            errorCount: 0,
            activeAgents: []
        };
    }

    static getInstance(): RooCoderMonitor {
        if (!RooCoderMonitor.instance) {
            RooCoderMonitor.instance = new RooCoderMonitor();
        }
        return RooCoderMonitor.instance;
    }

    trackToolUsage(toolId: string, executionTime: number): void {
        const currentCount = this.metrics.toolUsage.get(toolId) || 0;
        this.metrics.toolUsage.set(toolId, currentCount + 1);
        this.metrics.responseTime.push(executionTime);

        this.telemetry.trackEvent('tool_execution', {
            toolId,
            executionTime: executionTime.toString()
        });
    }

    trackError(error: Error): void {
        this.metrics.errorCount++;
        this.telemetry.trackError(error);
    }

    updateActiveAgents(agents: string[]): void {
        this.metrics.activeAgents = agents;
        this.telemetry.trackEvent('active_agents_updated', {
            count: agents.length.toString(),
            agents: agents.join(',')
        });
    }

    async getMetricsReport(): Promise<string> {
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