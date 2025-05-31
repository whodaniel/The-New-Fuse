import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
export class TraeMonitor {
    constructor() {
        this.logger = new Logger(TraeMonitor.name);
        this.heartbeatInterval = null;
        this.metricsCollectionInterval = null;
        this.metrics = new Map();
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new Redis(redisUrl);
    }
    async initialize() {
        try {
            // Verify Redis connection
            const pingResult = await this.redis.ping();
            if (pingResult !== 'PONG') {
                throw new Error('Redis connection failed');
            }
            this.logger.log('TraeMonitor initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize TraeMonitor:', error);
            throw error;
        }
    }
    async startHeartbeat(agentId) {
        // Clear any existing heartbeat interval
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        // Send initial heartbeat
        await this.sendHeartbeat(agentId);
        // Set up heartbeat interval (every 30 seconds)
        this.heartbeatInterval = setInterval(async () => {
            try {
                await this.sendHeartbeat(agentId);
            }
            catch (error) {
                this.logger.error('Error sending heartbeat:', error);
            }
        }, 30000); // 30 seconds
    }
    async sendHeartbeat(agentId) {
        const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            metadata: {
                version: '1.1.0',
                source: agentId,
                status: 'active'
            }
        };
        await this.redis.publish('agent:heartbeat', JSON.stringify(heartbeat));
    }
    enableMetrics(options) {
        // Set up metrics collection interval
        this.metricsCollectionInterval = setInterval(() => {
            this.reportMetrics();
        }, options.reportInterval);
    }
    recordMetric(data) {
        const messageType = data.messageType;
        if (!this.metrics.has(messageType)) {
            this.metrics.set(messageType, []);
        }
        const metricsList = this.metrics.get(messageType);
        if (metricsList) {
            metricsList.push(data);
        }
    }
    async reportMetrics() {
        const metricReport = {
            type: 'metric',
            timestamp: new Date().toISOString(),
            data: {
                messageFlow: this.calculateMessageFlow(),
                errorRate: this.calculateErrorRate(),
                averageProcessingTime: this.calculateAverageProcessingTime(),
                queueLength: this.calculateQueueLength()
            }
        };
        await this.redis.publish('monitoring:metrics', JSON.stringify(metricReport));
        // Clear old metrics after reporting
        this.metrics.clear();
    }
    calculateMessageFlow() {
        let totalMessages = 0;
        this.metrics.forEach(metricsList => {
            totalMessages += metricsList.length;
        });
        return totalMessages;
    }
    calculateErrorRate() {
        let totalErrors = 0;
        let totalMessages = 0;
        this.metrics.forEach(metricsList => {
            totalMessages += metricsList.length;
            metricsList.forEach(metric => {
                if (!metric.success) {
                    totalErrors++;
                }
            });
        });
        return totalMessages > 0 ? (totalErrors / totalMessages) : 0;
    }
    calculateAverageProcessingTime() {
        let totalTime = 0;
        let totalMessages = 0;
        this.metrics.forEach(metricsList => {
            metricsList.forEach(metric => {
                totalTime += metric.processingTime;
                totalMessages++;
            });
        });
        return totalMessages > 0 ? (totalTime / totalMessages) : 0;
    }
    calculateQueueLength() {
        // This would be implemented with actual queue monitoring
        // For now, return a placeholder value
        return 0;
    }
    onAlert(callback) {
        // Subscribe to alerts channel
        const alertSubscriber = this.redis.duplicate();
        alertSubscriber.subscribe('monitoring:alerts');
        alertSubscriber.on('message', (_channel, message) => {
            try {
                const alert = JSON.parse(message);
                callback(alert);
            }
            catch (error) {
                this.logger.error('Error processing alert:', error);
            }
        });
    }
    async cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.metricsCollectionInterval) {
            clearInterval(this.metricsCollectionInterval);
            this.metricsCollectionInterval = null;
        }
        await this.redis.quit();
    }
}
