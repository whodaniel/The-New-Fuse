import * as vscode from 'vscode';
import { NewFuseApiClient, IntegrationMetrics } from './ApiClient';
import { LoggingService } from './LoggingService';

interface ParticipantMetrics {
	requestCount: number;
	successCount: number;
	errorCount: number;
	totalResponseTime: number;
	averageResponseTime: number;
	lastRequestAt?: Date;
}

/**
 * Metrics Service for tracking performance and usage
 */
export class MetricsService {
	private participantMetrics: Map<string, ParticipantMetrics> = new Map();
	private apiClient: NewFuseApiClient;
	private loggingService: LoggingService;
	private metricsPanel?: vscode.WebviewPanel;

	constructor(apiClient: NewFuseApiClient, loggingService: LoggingService) {
		this.apiClient = apiClient;
		this.loggingService = loggingService;
	}

	/**
	 * Track a request for a participant
	 */
	trackRequest(participantId: string): void {
		const metrics = this.getOrCreateMetrics(participantId);
		metrics.requestCount++;
		metrics.lastRequestAt = new Date();
		
		this.loggingService.debug(`Request tracked for participant ${participantId}`);
	}

	/**
	 * Track a successful response
	 */
	trackSuccess(participantId: string, responseTime: number): void {
		const metrics = this.getOrCreateMetrics(participantId);
		metrics.successCount++;
		metrics.totalResponseTime += responseTime;
		metrics.averageResponseTime = metrics.totalResponseTime / metrics.successCount;
		
		this.loggingService.logPerformance(`Participant ${participantId}`, responseTime, true);
	}

	/**
	 * Track an error
	 */
	trackError(participantId: string, responseTime: number): void {
		const metrics = this.getOrCreateMetrics(participantId);
		metrics.errorCount++;
		
		this.loggingService.logPerformance(`Participant ${participantId}`, responseTime, false);
	}

	/**
	 * Get or create metrics for a participant
	 */
	private getOrCreateMetrics(participantId: string): ParticipantMetrics {
		let metrics = this.participantMetrics.get(participantId);
		
		if (!metrics) {
			metrics = {
				requestCount: 0,
				successCount: 0,
				errorCount: 0,
				totalResponseTime: 0,
				averageResponseTime: 0
			};
			this.participantMetrics.set(participantId, metrics);
		}
		
		return metrics;
	}

	/**
	 * Get metrics for a specific participant
	 */
	getParticipantMetrics(participantId: string): ParticipantMetrics | undefined {
		return this.participantMetrics.get(participantId);
	}

	/**
	 * Get all participant metrics
	 */
	getAllParticipantMetrics(): Map<string, ParticipantMetrics> {
		return new Map(this.participantMetrics);
	}

	/**
	 * Get aggregated metrics
	 */
	getAggregatedMetrics(): {
		totalRequests: number;
		totalSuccesses: number;
		totalErrors: number;
		averageResponseTime: number;
		errorRate: number;
		participantCount: number;
	} {
		let totalRequests = 0;
		let totalSuccesses = 0;
		let totalErrors = 0;
		let totalResponseTime = 0;
		let responseTimeCount = 0;

		for (const metrics of this.participantMetrics.values()) {
			totalRequests += metrics.requestCount;
			totalSuccesses += metrics.successCount;
			totalErrors += metrics.errorCount;
			totalResponseTime += metrics.totalResponseTime;
			responseTimeCount += metrics.successCount;
		}

		return {
			totalRequests,
			totalSuccesses,
			totalErrors,
			averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
			errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
			participantCount: this.participantMetrics.size
		};
	}

	/**
	 * Reset metrics
	 */
	resetMetrics(): void {
		this.participantMetrics.clear();
		this.loggingService.info('Metrics reset');
	}

	/**
	 * Show metrics panel
	 */
	async showMetricsPanel(): Promise<void> {
		if (this.metricsPanel) {
			this.metricsPanel.reveal();
			return;
		}

		this.metricsPanel = vscode.window.createWebviewPanel(
			'newFuseMetrics',
			'The New Fuse - Integration Metrics',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		this.metricsPanel.onDidDispose(() => {
			this.metricsPanel = undefined;
		});

		await this.updateMetricsPanel();

		// Set up periodic updates
		const updateInterval = setInterval(async () => {
			if (this.metricsPanel) {
				await this.updateMetricsPanel();
			} else {
				clearInterval(updateInterval);
			}
		}, 5000);
	}

	/**
	 * Update metrics panel content
	 */
	private async updateMetricsPanel(): Promise<void> {
		if (!this.metricsPanel) return;

		try {
			// Get local metrics
			const localMetrics = this.getAggregatedMetrics();
			
			// Get backend metrics
			let backendMetrics: IntegrationMetrics | null = null;
			try {
				backendMetrics = await this.apiClient.getMetrics();
			} catch (error) {
				this.loggingService.warn('Failed to fetch backend metrics', error);
			}

			const html = this.generateMetricsHtml(localMetrics, backendMetrics);
			this.metricsPanel.webview.html = html;
		} catch (error) {
			this.loggingService.error('Failed to update metrics panel', error);
		}
	}

	/**
	 * Generate HTML for metrics panel
	 */
	private generateMetricsHtml(localMetrics: any, backendMetrics: IntegrationMetrics | null): string {
		const participantMetrics = Array.from(this.participantMetrics.entries());

		return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The New Fuse - Integration Metrics</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
        }
        .section h2 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-textBlockQuote-border);
            padding-bottom: 10px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .metric-card {
            padding: 15px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
        }
        .metric-label {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .participant-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .participant-table th,
        .participant-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-textBlockQuote-border);
        }
        .participant-table th {
            background-color: var(--vscode-textBlockQuote-background);
            font-weight: bold;
        }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-good { background-color: #4caf50; }
        .status-warning { background-color: #ff9800; }
        .status-error { background-color: #f44336; }
        .last-updated {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>The New Fuse - Integration Metrics</h1>
        
        <div class="section">
            <h2>📊 Overall Statistics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Total Requests</div>
                    <div class="metric-value">${localMetrics.totalRequests}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Success Rate</div>
                    <div class="metric-value">${((localMetrics.totalSuccesses / Math.max(localMetrics.totalRequests, 1)) * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Error Rate</div>
                    <div class="metric-value">${localMetrics.errorRate.toFixed(1)}%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Avg Response Time</div>
                    <div class="metric-value">${localMetrics.averageResponseTime.toFixed(0)}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Active Participants</div>
                    <div class="metric-value">${localMetrics.participantCount}</div>
                </div>
            </div>
        </div>

        ${backendMetrics ? `
        <div class="section">
            <h2>🔧 Backend Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Total Participants</div>
                    <div class="metric-value">${backendMetrics.totalParticipants}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Active Participants</div>
                    <div class="metric-value">${backendMetrics.activeParticipants}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Backend Requests</div>
                    <div class="metric-value">${backendMetrics.totalRequests}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Backend Avg Response</div>
                    <div class="metric-value">${backendMetrics.averageResponseTime.toFixed(0)}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Backend Error Rate</div>
                    <div class="metric-value">${backendMetrics.errorRate.toFixed(1)}%</div>
                </div>
            </div>
        </div>
        ` : `
        <div class="section">
            <h2>⚠️ Backend Metrics</h2>
            <p>Unable to fetch backend metrics. Check your connection and configuration.</p>
        </div>
        `}

        ${participantMetrics.length > 0 ? `
        <div class="section">
            <h2>👥 Participant Details</h2>
            <table class="participant-table">
                <thead>
                    <tr>
                        <th>Participant</th>
                        <th>Requests</th>
                        <th>Success Rate</th>
                        <th>Avg Response</th>
                        <th>Last Request</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${participantMetrics.map(([id, metrics]) => {
                        const successRate = metrics.requestCount > 0 ? (metrics.successCount / metrics.requestCount) * 100 : 0;
                        const status = successRate >= 90 ? 'good' : successRate >= 70 ? 'warning' : 'error';
                        const lastRequest = metrics.lastRequestAt ? metrics.lastRequestAt.toLocaleString() : 'Never';
                        
                        return `
                        <tr>
                            <td>${id}</td>
                            <td>${metrics.requestCount}</td>
                            <td>${successRate.toFixed(1)}%</td>
                            <td>${metrics.averageResponseTime.toFixed(0)}ms</td>
                            <td>${lastRequest}</td>
                            <td><span class="status-indicator status-${status}"></span>${status.toUpperCase()}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        ` : `
        <div class="section">
            <h2>👥 Participant Details</h2>
            <p>No participant interactions recorded yet.</p>
        </div>
        `}

        <div class="last-updated">
            Last updated: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
        `;
	}

	/**
	 * Dispose metrics service
	 */
	dispose(): void {
		if (this.metricsPanel) {
			this.metricsPanel.dispose();
		}
		this.loggingService.info('Metrics service disposed');
	}
}
