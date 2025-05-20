const fs = require('fs');
const path = require('path');

// Dashboard configuration
const config = {
    dataRetentionDays: 30,
    updateInterval: 6 * 60 * 60 * 1000, // 6 hours
    chartColors: {
        messageRate: '#2196f3',
        latency: '#4caf50',
        errorRate: '#f44336',
        memoryUsage: '#ff9800'
    }
};

function loadMetricsHistory() {
    const resultsDir = path.join(__dirname, '..', 'benchmark-results');
    const files = fs.readdirSync(resultsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
            path: path.join(resultsDir, f),
            timestamp: fs.statSync(path.join(resultsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

    // Load only files within retention period
    const retentionCutoff = Date.now() - (config.dataRetentionDays * 24 * 60 * 60 * 1000);
    const recentFiles = files.filter(f => f.timestamp >= retentionCutoff);

    return recentFiles.map(file => {
        const data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        return {
            timestamp: file.timestamp,
            metrics: data.profiles.stress.metrics
        };
    });
}

function generateChartData(history) {
    const timestamps = history.map(h => new Date(h.timestamp).toLocaleString());
    
    return {
        messageRate: {
            labels: timestamps,
            data: history.map(h => h.metrics.messagesPerSecond)
        },
        latency: {
            labels: timestamps,
            data: history.map(h => h.metrics.averageLatency)
        },
        errorRate: {
            labels: timestamps,
            data: history.map(h => h.metrics.errorRate * 100)
        },
        memoryUsage: {
            labels: timestamps,
            data: history.map(h => h.metrics.memoryUsage / (1024 * 1024))
        }
    };
}

function generateDashboardHtml(history) {
    const chartData = generateChartData(history);
    const lastMetrics = history[0].metrics;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>MCP Performance Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .dashboard-header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-title {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 1.8em;
            font-weight: bold;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .updated-at {
            text-align: center;
            color: #666;
            margin-top: 30px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <h1>MCP Performance Dashboard</h1>
        <p>Performance metrics from the last ${config.dataRetentionDays} days</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-title">Message Rate</div>
            <div class="metric-value">${Math.round(lastMetrics.messagesPerSecond)}/sec</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Average Latency</div>
            <div class="metric-value">${Math.round(lastMetrics.averageLatency)}ms</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Error Rate</div>
            <div class="metric-value">${(lastMetrics.errorRate * 100).toFixed(2)}%</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Memory Usage</div>
            <div class="metric-value">${Math.round(lastMetrics.memoryUsage / (1024 * 1024))}MB</div>
        </div>
    </div>

    <div class="charts-grid">
        <div class="chart-container">
            <canvas id="messageRateChart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="latencyChart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="errorRateChart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="memoryUsageChart"></canvas>
        </div>
    </div>

    <div class="updated-at">
        Last updated: ${new Date().toLocaleString()}
    </div>

    <script>
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        };

        function createChart(id, label, data, color) {
            new Chart(
                document.getElementById(id),
                {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: label,
                            data: data.data,
                            borderColor: color,
                            tension: 0.1,
                            fill: false
                        }]
                    },
                    options: chartOptions
                }
            );
        }

        // Create charts
        createChart(
            'messageRateChart',
            'Messages/sec',
            ${JSON.stringify(chartData.messageRate)},
            '${config.chartColors.messageRate}'
        );

        createChart(
            'latencyChart',
            'Latency (ms)',
            ${JSON.stringify(chartData.latency)},
            '${config.chartColors.latency}'
        );

        createChart(
            'errorRateChart',
            'Error Rate (%)',
            ${JSON.stringify(chartData.errorRate)},
            '${config.chartColors.errorRate}'
        );

        createChart(
            'memoryUsageChart',
            'Memory Usage (MB)',
            ${JSON.stringify(chartData.memoryUsage)},
            '${config.chartColors.memoryUsage}'
        );
    </script>
</body>
</html>`;
}

function main() {
    try {
        // Load metrics history
        const history = loadMetricsHistory();
        if (history.length === 0) {
            console.log('No metrics data found');
            return;
        }

        // Generate dashboard
        const dashboardHtml = generateDashboardHtml(history);
        
        // Create metrics-dashboard directory if it doesn't exist
        const dashboardDir = path.join(__dirname, '..', '..', '..', 'metrics-dashboard');
        if (!fs.existsSync(dashboardDir)) {
            fs.mkdirSync(dashboardDir, { recursive: true });
        }

        // Write dashboard HTML
        fs.writeFileSync(
            path.join(dashboardDir, 'index.html'),
            dashboardHtml
        );

        console.log('Dashboard updated successfully');

    } catch (error) {
        console.error('Error updating dashboard:', error.message);
        process.exit(1);
    }
}

main();