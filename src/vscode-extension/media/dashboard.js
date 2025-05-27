// Dashboard UI JavaScript
(function() {
    // Get VS Code API
    const vscode = acquireVsCodeApi();
    
    // DOM Elements
    const refreshButton = document.getElementById('refresh-button');
    const timeRangeSelect = document.getElementById('time-range');
    const metricsContainer = document.getElementById('metrics-container');
    const chartContainer = document.getElementById('chart-container');
    const modelPerformanceContainer = document.getElementById('model-performance');
    const requestsContainer = document.getElementById('requests-container');

    // Chart instances
    let latencyChart = null;
    let throughputChart = null;
    let tokenUsageChart = null;
    
    // Initialize
    document.addEventListener('DOMContentLoaded', initialize);
    
    function initialize() {
        // Setup event listeners
        if (refreshButton) {
            refreshButton.addEventListener('click', refreshData);
        }
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', changeTimeRange);
        }
        
        // Request initial data
        requestData();
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'initialData':
                    renderInitialData(message.data);
                    break;
                case 'updateData':
                    updateDashboard(message.data);
                    break;
                case 'updateMetric':
                    updateMetric(message.metric, message.value);
                    break;
                case 'error':
                    showError(message.error);
                    break;
            }
        });
    }
    
    function requestData() {
        vscode.postMessage({
            type: 'requestData',
            timeRange: timeRangeSelect ? timeRangeSelect.value : '1h'
        });
    }
    
    function refreshData() {
        // Show loading state
        showLoading(true);
        
        vscode.postMessage({
            type: 'refreshData',
            timeRange: timeRangeSelect ? timeRangeSelect.value : '1h'
        });
    }
    
    function changeTimeRange() {
        // Show loading state
        showLoading(true);
        
        vscode.postMessage({
            type: 'changeTimeRange',
            timeRange: timeRangeSelect.value
        });
    }
    
    function renderInitialData(data) {
        // Hide loading state
        showLoading(false);
        
        if (!data) {
            showError('No monitoring data available');
            return;
        }
        
        // Render metrics
        renderMetrics(data.metrics);
        
        // Render charts
        renderCharts(data.chartData);
        
        // Render model performance
        renderModelPerformance(data.modelPerformance);
        
        // Render recent requests
        renderRecentRequests(data.recentRequests);
    }
    
    function updateDashboard(data) {
        // Hide loading state
        showLoading(false);
        
        if (!data) {
            return;
        }
        
        // Update metrics
        if (data.metrics) {
            updateMetrics(data.metrics);
        }
        
        // Update charts
        if (data.chartData) {
            updateCharts(data.chartData);
        }
        
        // Update model performance
        if (data.modelPerformance) {
            updateModelPerformance(data.modelPerformance);
        }
        
        // Update recent requests
        if (data.recentRequests) {
            updateRecentRequests(data.recentRequests);
        }
    }
    
    function renderMetrics(metrics) {
        if (!metricsContainer || !metrics) {
            return;
        }
        
        metricsContainer.innerHTML = '';
        
        Object.entries(metrics).forEach(([key, value]) => {
            const metricEl = document.createElement('div');
            metricEl.className = 'metric-card';
            metricEl.innerHTML = `
                <h3>${formatMetricName(key)}</h3>
                <div class="metric-value" id="metric-${key}">${formatMetricValue(key, value)}</div>
            `;
            metricsContainer.appendChild(metricEl);
        });
    }
    
    function updateMetrics(metrics) {
        if (!metrics) {
            return;
        }
        
        Object.entries(metrics).forEach(([key, value]) => {
            const metricEl = document.getElementById(`metric-${key}`);
            if (metricEl) {
                metricEl.textContent = formatMetricValue(key, value);
            }
        });
    }
    
    function updateMetric(metric, value) {
        const metricEl = document.getElementById(`metric-${metric}`);
        if (metricEl) {
            metricEl.textContent = formatMetricValue(metric, value);
        }
    }
    
    function renderCharts(chartData) {
        if (!chartContainer || !chartData) {
            return;
        }
        
        // Clear chart container
        chartContainer.innerHTML = `
            <div class="chart-wrapper">
                <h3>Response Latency (ms)</h3>
                <canvas id="latency-chart"></canvas>
            </div>
            <div class="chart-wrapper">
                <h3>Requests Per Minute</h3>
                <canvas id="throughput-chart"></canvas>
            </div>
            <div class="chart-wrapper">
                <h3>Token Usage</h3>
                <canvas id="token-usage-chart"></canvas>
            </div>
        `;
        
        // Create charts
        createLatencyChart(chartData.latency);
        createThroughputChart(chartData.throughput);
        createTokenUsageChart(chartData.tokenUsage);
    }
    
    function updateCharts(chartData) {
        if (!chartData) {
            return;
        }
        
        if (chartData.latency && latencyChart) {
            updateChartData(latencyChart, chartData.latency);
        }
        
        if (chartData.throughput && throughputChart) {
            updateChartData(throughputChart, chartData.throughput);
        }
        
        if (chartData.tokenUsage && tokenUsageChart) {
            updateChartData(tokenUsageChart, chartData.tokenUsage);
        }
    }
    
    function createLatencyChart(data) {
        const ctx = document.getElementById('latency-chart');
        if (!ctx) {return;}
        
        latencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Average Latency',
                    data: data.values,
                    borderColor: '#4e79a7',
                    backgroundColor: 'rgba(78, 121, 167, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: getChartOptions('Time', 'Milliseconds')
        });
    }
    
    function createThroughputChart(data) {
        const ctx = document.getElementById('throughput-chart');
        if (!ctx) {return;}
        
        throughputChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Requests',
                    data: data.values,
                    backgroundColor: '#59a14f',
                }]
            },
            options: getChartOptions('Time', 'Count')
        });
    }
    
    function createTokenUsageChart(data) {
        const ctx = document.getElementById('token-usage-chart');
        if (!ctx) {return;}
        
        tokenUsageChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Input Tokens',
                        data: data.inputValues,
                        borderColor: '#f28e2c',
                        backgroundColor: 'rgba(242, 142, 44, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Output Tokens',
                        data: data.outputValues,
                        borderColor: '#e15759',
                        backgroundColor: 'rgba(225, 87, 89, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: getChartOptions('Time', 'Tokens')
        });
    }
    
    function getChartOptions(xLabel, yLabel) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xLabel
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel
                    },
                    beginAtZero: true
                }
            }
        };
    }
    
    function updateChartData(chart, data) {
        chart.data.labels = data.labels;
        
        if (chart === tokenUsageChart) {
            chart.data.datasets[0].data = data.inputValues;
            chart.data.datasets[1].data = data.outputValues;
        } else {
            chart.data.datasets[0].data = data.values;
        }
        
        chart.update();
    }
    
    function renderModelPerformance(performance) {
        if (!modelPerformanceContainer || !performance || !performance.length) {
            return;
        }
        
        modelPerformanceContainer.innerHTML = `
            <h3>Model Performance</h3>
            <table class="performance-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Avg. Latency</th>
                        <th>Requests</th>
                        <th>Error Rate</th>
                    </tr>
                </thead>
                <tbody id="model-performance-body">
                </tbody>
            </table>
        `;
        
        const tbody = document.getElementById('model-performance-body');
        if (!tbody) {return;}
        
        performance.forEach(model => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${model.name}</td>
                <td>${model.latency.toFixed(2)} ms</td>
                <td>${model.requests}</td>
                <td>${(model.errorRate * 100).toFixed(2)}%</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    function updateModelPerformance(performance) {
        if (!performance || !performance.length) {
            return;
        }
        
        const tbody = document.getElementById('model-performance-body');
        if (!tbody) {return;}
        
        tbody.innerHTML = '';
        performance.forEach(model => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${model.name}</td>
                <td>${model.latency.toFixed(2)} ms</td>
                <td>${model.requests}</td>
                <td>${(model.errorRate * 100).toFixed(2)}%</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    function renderRecentRequests(requests) {
        if (!requestsContainer || !requests || !requests.length) {
            return;
        }
        
        requestsContainer.innerHTML = `
            <h3>Recent Requests</h3>
            <div class="requests-list" id="requests-list"></div>
        `;
        
        const list = document.getElementById('requests-list');
        if (!list) {return;}
        
        requests.forEach(request => {
            const item = document.createElement('div');
            item.className = `request-item ${request.status}`;
            item.innerHTML = `
                <div class="request-header">
                    <span class="request-time">${formatTime(request.timestamp)}</span>
                    <span class="request-model">${request.model}</span>
                    <span class="request-status">${request.status}</span>
                </div>
                <div class="request-prompt">${truncateText(request.prompt, 100)}</div>
                <div class="request-stats">
                    <span>Latency: ${request.latency.toFixed(2)} ms</span>
                    <span>Tokens: ${request.inputTokens} in / ${request.outputTokens} out</span>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    function updateRecentRequests(requests) {
        if (!requests || !requests.length) {
            return;
        }
        
        const list = document.getElementById('requests-list');
        if (!list) {return;}
        
        list.innerHTML = '';
        requests.forEach(request => {
            const item = document.createElement('div');
            item.className = `request-item ${request.status}`;
            item.innerHTML = `
                <div class="request-header">
                    <span class="request-time">${formatTime(request.timestamp)}</span>
                    <span class="request-model">${request.model}</span>
                    <span class="request-status">${request.status}</span>
                </div>
                <div class="request-prompt">${truncateText(request.prompt, 100)}</div>
                <div class="request-stats">
                    <span>Latency: ${request.latency.toFixed(2)} ms</span>
                    <span>Tokens: ${request.inputTokens} in / ${request.outputTokens} out</span>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    function showError(message) {
        const errorEl = document.getElementById('error-message');
        if (!errorEl) {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';
            errorContainer.innerHTML = `<div id="error-message" class="error">${message}</div>`;
            document.body.insertBefore(errorContainer, document.body.firstChild);
        } else {
            errorEl.textContent = message;
            errorEl.parentElement.style.display = 'block';
        }
    }
    
    function showLoading(isLoading) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = isLoading ? 'flex' : 'none';
        }
    }
    
    // Utility Functions
    function formatMetricName(key) {
        return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }
    
    function formatMetricValue(key, value) {
        if (key.includes('rate')) {
            return `${(value * 100).toFixed(2)}%`;
        } else if (key.includes('latency')) {
            return `${value.toFixed(2)} ms`;
        } else if (key.includes('token')) {
            return value.toLocaleString();
        } else {
            return typeof value === 'number' ? value.toLocaleString() : value;
        }
    }
    
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }
    
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
})();
