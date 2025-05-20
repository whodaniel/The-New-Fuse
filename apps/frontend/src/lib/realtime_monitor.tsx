    constructor() {
        this.metrics = new Map();
        this.alerts = new Set();
        this.thresholds = this.loadThresholds();
    }
    async startMonitoring() {
        await this.initializeWebSocket();
        this.startMetricsCollection();
        this.enableAnomalyDetection();
    }
    async initializeWebSocket() {
        this.socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/metrics`);
        this.socket.onmessage = (event) => {
            const metric = JSON.parse(event.data);
            this.handleMetricUpdate(metric);
        };
    }
    startMetricsCollection() {
        setInterval(() => {
            this.fetchMetrics();
        }, 5000);
    }
    async fetchMetrics() {
        try {
            const response = await fetch('/api/metrics');
            const metrics = await response.json();
            metrics.forEach(metric => this.handleMetricUpdate(metric));
        }
        catch (error) {
            console.error('Error fetching metrics:', error);
        }
    }
    enableAnomalyDetection() {
        this.metrics.forEach((value, name) => {
            this.checkThresholds({ name, value });
        });
    }
    handleMetricUpdate(metric) {
        this.metrics.set(metric.name, metric.value);
        this.checkThresholds(metric);
        this.updateDashboard();
    }
    checkThresholds(metric) {
        const threshold = this.thresholds[metric.name];
        if (threshold && metric.value > threshold) {
            const alert = {
                name: metric.name,
                value: metric.value,
                threshold: threshold,
                timestamp: new Date()
            };
            this.handleAlert(alert);
        }
    }
    async handleAlert(alert) {
        await this.showUserNotification(alert);
        this.logAlertMetrics(alert);
    }
    async showUserNotification(alert) {
        const notification = new Notification(`Alert: ${alert.name}`, {
            body: `Value: ${alert.value}, Threshold: ${alert.threshold}`
        });
        notification.onclick = () => {
            window.focus();
        };
    }
    logAlertMetrics(alert) {
        
        this.alerts.add(alert);
    }
    updateDashboard() {
        const dashboard = document.getElementById('dashboard');
        if (!dashboard)
            return;
        dashboard.innerHTML = '';
        this.metrics.forEach((value, name) => {
            const metricElement = document.createElement('div');
            metricElement.className = 'metric';
            metricElement.innerHTML = `
                <h3>${name}</h3>
                <p>Value: ${value}</p>
            `;
            dashboard.appendChild(metricElement);
        });
    }
    loadThresholds() {
        return {
            cpuUsage: 90,
            memoryUsage: 80,
            diskUsage: 90,
            networkUsage: 90
        };
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const systemMonitor = new SystemMonitor();
    systemMonitor.startMonitoring();
});
export {};
//# sourceMappingURL=realtime_monitor.js.map