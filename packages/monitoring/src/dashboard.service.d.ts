import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../../cache/src/redis-cache.service';
import { OptimizedQueueService } from '../../job-queue/src/optimized-queue.service';
import { OptimizedWebSocketService } from '../../websocket/src/optimized-websocket.service';
import { OptimizedA2AService } from '../../a2a-enhanced/src/optimized-a2a.service';
export interface SystemMetrics {
    timestamp: number;
    system: {
        cpu: number;
        memory: number;
        disk: number;
        uptime: number;
    };
    cache: {
        hitRate: number;
        memoryUsage: number;
        totalKeys: number;
        connections: number;
    };
    queue: {
        totalJobs: number;
        activeJobs: number;
        completedJobs: number;
        failedJobs: number;
        throughput: number;
    };
    websocket: {
        activeConnections: number;
        messagesPerSecond: number;
        averageLatency: number;
        errorRate: number;
    };
    a2a: {
        messagesSent: number;
        messagesReceived: number;
        averageLatency: number;
        activeAgents: number;
        errorRate: number;
    };
    database: {
        activeConnections: number;
        slowQueries: number;
        averageQueryTime: number;
        connectionPoolSize: number;
    };
}
export interface PerformanceAlert {
    id: string;
    type: 'warning' | 'error' | 'critical';
    service: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    message: string;
    resolved: boolean;
}
export interface DashboardData {
    overview: {
        status: 'healthy' | 'warning' | 'critical';
        uptime: number;
        totalUsers: number;
        activeAgents: number;
        totalWorkflows: number;
        systemLoad: number;
    };
    realTimeMetrics: SystemMetrics;
    historicalData: {
        timeRange: string;
        dataPoints: SystemMetrics[];
    };
    alerts: PerformanceAlert[];
    healthChecks: {
        redis: {
            status: string;
            latency: number;
        };
        database: {
            status: string;
            latency: number;
        };
        queue: {
            status: string;
            pendingJobs: number;
        };
        websocket: {
            status: string;
            connections: number;
        };
        a2a: {
            status: string;
            agents: number;
        };
    };
    trends: {
        userGrowth: number[];
        agentActivity: number[];
        workflowExecution: number[];
        systemPerformance: number[];
    };
}
export declare class MonitoringDashboardService implements OnModuleInit {
    private configService;
    private cacheService;
    private queueService;
    private websocketService;
    private a2aService;
    private readonly logger;
    private metricsHistory;
    private alerts;
    private isCollecting;
    private readonly thresholds;
    private metricsInterval;
    private alertsInterval;
    private healthCheckInterval;
    constructor(configService: ConfigService, cacheService: RedisCacheService, queueService: OptimizedQueueService, websocketService: OptimizedWebSocketService, a2aService: OptimizedA2AService);
    onModuleInit(): Promise<void>;
    private initializeMonitoring;
    getDashboardData(): Promise<DashboardData>;
    private collectCurrentMetrics;
    private performHealthChecks;
    private calculateTrends;
    private processAlerts;
}
//# sourceMappingURL=dashboard.service.d.ts.map