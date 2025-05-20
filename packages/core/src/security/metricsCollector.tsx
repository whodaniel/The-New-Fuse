import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { RedisManager } from '../redis/redisManager.js';

const logger: Logger = getLogger('metrics_collector');

export interface SystemMetrics {
    timestamp: number;
    cpu: {
        usage: number;
        count: number;
        load: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
        cached: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
    };
}

export interface ApplicationMetrics {
    timestamp: number;
    requests: {
        total: number;
        success: number;
        failed: number;
        latency: number;
    };
    connections: {
        active: number;
        idle: number;
        closed: number;
    };
    tasks: {
        pending: number;
        running: number;
        completed: number;
        failed: number;
    };
    cache: {
        hits: number;
        misses: number;
        size: number;
    };
}

export interface AgentMetrics {
    timestamp: number;
    agentId: string;
    status: 'ACTIVE' | 'IDLE' | 'ERROR';
    performance: {
        tasksCompleted: number;
        avgProcessingTime: number;
        errorRate: number;
        successRate: number;
    };
    resources: {
        memoryUsage: number;
        cpuUsage: number;
        threadCount: number;
    };
    queue: {
        length: number;
        oldestItem: number;
        processingRate: number;
    };
}

export class MetricsCollector {
    private readonly redisManager: RedisManager;
    private readonly metricsPrefix: string;
    private readonly retentionPeriod: number;
    private collectionInterval: NodeJS.Timeout | null;

    constructor(
        redisManager: RedisManager,
        options: {
            metricsPrefix?: string;
            retentionPeriod?: number;
        } = {}
    ) {
        this.redisManager = redisManager;
        this.metricsPrefix = options.metricsPrefix || 'metrics:';
        this.retentionPeriod = options.retentionPeriod || 86400; // 24 hours
        this.collectionInterval = null;
    }

    public async startCollection(intervalMs: number = 60000): Promise<void> {
        if (this.collectionInterval) {
            throw new Error('Metrics collection already started');
        }

        try {
            await this.collectMetrics();
            this.collectionInterval = setInterval(() => {
                this.collectMetrics().catch(error => {
                    logger.error('Error collecting metrics:', error);
                });
            }, intervalMs);
            logger.info(`Started metrics collection with interval ${intervalMs}ms`);
        } catch (error) {
            logger.error('Failed to start metrics collection:', error);
            throw error;
        }
    }

    public async stopCollection(): Promise<void> {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
            logger.info('Stopped metrics collection');
        }
    }

    private async collectMetrics(): Promise<void> {
        try {
            const timestamp = Date.now();

            // Collect different types of metrics
            const [systemMetrics, appMetrics, agentMetrics] = await Promise.all([
                this.collectSystemMetrics(),
                this.collectApplicationMetrics(),
                this.collectAgentMetrics()
            ]);

            // Store metrics in Redis
            await Promise.all([
                this.storeMetrics('system', systemMetrics),
                this.storeMetrics('application', appMetrics),
                this.storeMetrics('agents', agentMetrics)
            ]);

            logger.debug('Successfully collected and stored metrics');
        } catch (error) {
            logger.error('Error in metrics collection:', error);
        }
    }

    private async collectSystemMetrics(): Promise<SystemMetrics> {
        // Implementation would use a system metrics library like node-os-utils
        return {
            timestamp: Date.now(),
            cpu: {
                usage: 0,
                count: 0,
                load: [0, 0, 0]
            },
            memory: {
                total: 0,
                used: 0,
                free: 0,
                cached: 0
            },
            disk: {
                total: 0,
                used: 0,
                free: 0
            },
            network: {
                bytesIn: 0,
                bytesOut: 0,
                packetsIn: 0,
                packetsOut: 0
            }
        };
    }

    private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
        try {
            const [connectionCount, queueLength] = await Promise.all([
                this.redisManager.getConnectionCount(),
                this.redisManager.getQueueLength()
            ]);

            return {
                timestamp: Date.now(),
                requests: {
                    total: 0,
                    success: 0,
                    failed: 0,
                    latency: 0
                },
                connections: {
                    active: connectionCount,
                    idle: 0,
                    closed: 0
                },
                tasks: {
                    pending: queueLength,
                    running: 0,
                    completed: 0,
                    failed: 0
                },
                cache: {
                    hits: 0,
                    misses: 0,
                    size: 0
                }
            };
        } catch (error) {
            logger.error('Error collecting application metrics:', error);
            throw error;
        }
    }

    private async collectAgentMetrics(): Promise<AgentMetrics[]> {
        try {
            // Implementation would collect metrics from all active agents
            return [];
        } catch (error) {
            logger.error('Error collecting agent metrics:', error);
            throw error;
        }
    }

    private async storeMetrics(type: string, metrics: unknown): Promise<void> {
        try {
            const key = `${this.metricsPrefix}${type}:${Date.now()}`;
            await this.redisManager.saveState(key, metrics as any);
            logger.debug(`Stored ${type} metrics`);

            // Clean up old metrics
            await this.cleanupOldMetrics(type);
        } catch (error) {
            logger.error(`Error storing ${type} metrics:`, error);
            throw error;
        }
    }

    private async cleanupOldMetrics(type: string): Promise<void> {
        try {
            const cutoff = Date.now() - this.retentionPeriod * 1000;

            // Implementation would delete metrics older than cutoff
            // This would use Redis SCAN and deletion commands
        } catch (error) {
            logger.error(`Error cleaning up old ${type} metrics:`, error);
        }
    }

    public async getMetrics(
        type: string,
        startTime: number,
        endTime: number = Date.now()
    ): Promise<any[]> {
        try {
            const pattern = `${this.metricsPrefix}${type}:*`;
            // Implementation would retrieve and return metrics within time range
            return [];
        } catch (error) {
            logger.error('Error retrieving metrics:', error);
            throw error;
        }
    }

    public async getLatestMetrics(type: string): Promise<any | null> {
        try {
            const pattern = `${this.metricsPrefix}${type}:*`;
            // Implementation would retrieve and return most recent metrics
            return null;
        } catch (error) {
            logger.error('Error retrieving latest metrics:', error);
            throw error;
        }
    }

    public async calculateAggregates(
        type: string,
        startTime: number,
        endTime: number = Date.now()
    ): Promise<any> {
        try {
            const metrics = await this.getMetrics(type, startTime, endTime);
            // Implementation would calculate various aggregates (avg, min, max, etc.)
            return {};
        } catch (error) {
            logger.error('Error calculating metric aggregates:', error);
            throw error;
        }
    }
}
