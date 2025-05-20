import * as vscode from 'vscode';
import { MetricsCollector, MetricPoint, MetricAggregation } from './metrics-collector.js';

export interface DashboardPanel {
    metrics: string[];
    refreshInterval: number;
    title: string;
}

export class DashboardManager {
    private panels: Map<string, vscode.WebviewPanel> = new Map();
    private readonly metricsCollector: MetricsCollector;

    constructor(metricsCollector: MetricsCollector) {
        this.metricsCollector = metricsCollector;
    }

    public createDashboard(config: DashboardPanel): vscode.WebviewPanel {
        const panel = vscode.window.createWebviewPanel(
            'metricsDashboard',
            config.title,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        this.setupDashboard(panel, config);
        this.panels.set(config.title, panel);

        panel.onDidDispose(() => {
            this.panels.delete(config.title);
        });

        return panel;
    }

    private setupDashboard(panel: vscode.WebviewPanel, config: DashboardPanel): void {
        const updateInterval = setInterval(() => {
            const data = config.metrics.map(metric => ({
                name: metric,
                points: this.metricsCollector.getMetrics(metric),
                aggregation: this.metricsCollector.getAggregation(metric)
            }));

            panel.webview.html = this.generateDashboardHtml(config.title, data);
        }, config.refreshInterval);

        panel.onDidDispose(() => clearInterval(updateInterval));
    }

    private generateDashboardHtml(title: string, data: Array<{
        name: string;
        points: MetricPoint[];
        aggregation: MetricAggregation;
    }>): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${title}</title>
                    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
                </head>
                <body>
                    ${data.map(metric => `
                        <div id="graph-${metric.name}"></div>
                        <script>
                            const data = ${JSON.stringify(metric.points)};
                            Plotly.newPlot('graph-${metric.name}', [{
                                x: data.map(p => new Date(p.timestamp)),
                                y: data.map(p => p.value),
                                type: 'scatter',
                                name: '${metric.name}'
                            }]);
                        </script>
                        <div class="aggregation">
                            <h3>${metric.name} Statistics</h3>
                            <p>Min: ${metric.aggregation.min}</p>
                            <p>Max: ${metric.aggregation.max}</p>
                            <p>Average: ${metric.aggregation.avg.toFixed(2)}</p>
                            <p>Count: ${metric.aggregation.count}</p>
                        </div>
                    `).join('')}
                </body>
            </html>
        `;
    }
}
