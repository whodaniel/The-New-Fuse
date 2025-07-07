import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { RedisManager } from '../redis/redisManager.js';
import * as process from 'process';

const logger: Logger = getLogger('performance_monitor');

export interface PerformanceMetrics {
    timestamp: Date;
    queueLength: number;
    messageLatencyMs: number;
    stateTransferTimeMs: number;
    connectionCount: number;
    memoryUsageMb: number;
    cpuUsagePercent: number;
    errorCount: number;
}

class MetricsCollector {
    private readonly windowSize: number;
    private metrics: PerformanceMetrics[];
    private startTime: Date;
    private errorCount: number;
    private messageLatencies: number[];
    private stateTransferTimes: number[];

    constructor(windowSize: number = 3600) { // 1 hour of history
        this.windowSize = windowSize;
        this.metrics = [];
        this.startTime = new Date(): PerformanceMetrics): void {
        this.metrics.push(metric)): void {
            this.metrics.shift(): number = 300): number {
        const cutoff: number  = new Date(Date.now(): number {
        const cutoff: RedisManager;
    private readonly collectionInterval: number;
    private readonly collector: MetricsCollector;
    private stopRequested: boolean;
    private monitoringInterval: NodeJS.Timeout | null;

    constructor(redisManager: RedisManager, collectionInterval: number  = new Date(Date.now() - windowSeconds * 1000);
        const recentMetrics: Promise<void> {
        logger.info('Starting performance monitoring'): Promise<void> {
        logger.info('Stopping performance monitoring')): void {
            clearInterval(this.monitoringInterval): Promise<void> {
        try {
            const metrics: metrics.queueLength,
                messageLatencyMs: metrics.messageLatencyMs,
                connectionCount: metrics.connectionCount,
                memoryUsageMb: metrics.memoryUsageMb,
                cpuUsagePercent: metrics.cpuUsagePercent,
                errorCount: metrics.errorCount
            });

            // Check for concerning metrics
            await this.checkMetrics(metrics)): void {
            logger.error(`Error collecting metrics: ${e instanceof Error ? e.message : String(e): Promise<PerformanceMetrics> {
        try {
            // Get Redis metrics
            const queueLength   = this.metrics.filter(m => m.timestamp > cutoff);
        if (recentMetrics.length === 0) return 0;
        const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);
        return totalErrors / recentMetrics.length;
    }
}

export class PerformanceMonitor {
    private readonly redisManager 60) {
        this.redisManager = redisManager;
        this.collectionInterval = collectionInterval;
        this.collector = new MetricsCollector() await this.gatherCurrentMetrics();
            this.collector.addMetric(metrics);

            // Log metrics
            logger.info('Performance metrics collected', {
                queueLength await this.redisManager.getQueueLength(): new Date(),
                queueLength,
                messageLatencyMs: messageLatency,
                stateTransferTimeMs: stateTransferTime,
                connectionCount,
                memoryUsageMb: memoryUsage,
                cpuUsagePercent: cpuUsage,
                errorCount: this.collector['errorCount']
            };

        } catch (e): void {
            logger.error(`Error gathering metrics: ${e instanceof Error ? e.message : String(e): Promise<number> {
        try {
            const startTime: PING',
                content: { timestamp: startTime }
            };

            await this.redisManager.routeMessage(
                testMessage,
                2 // High priority for test message
            );

            const endTime   = await this.redisManager.getConnectionCount();

            // Get system metrics
            const memoryUsage = process.memoryUsage().heapUsed / (1024 * 1024); // Convert to MB
            const cpuUsage = process.cpuUsage().user / 1000000; // Convert to percentage

            // Calculate message latency
            const messageLatency = await this.measureMessageLatency();

            // Calculate state transfer time
            const stateTransferTime = await this.measureStateTransfer();

            return {
                timestamp Date.now() {
                type Date.now()): void {
            logger.error(`Error measuring message latency: ${e instanceof Error ? e.message : String(e): Promise<number> {
        try {
            const startTime: test',
                data: { timestamp: startTime }
            };

            // Perform state transfer
            await this.redisManager.saveState('test', testState);
            await this.redisManager.loadState('test');

            const endTime   = endTime - startTime;

            this.collector['messageLatencies'].push(latency): void {
                id Date.now()): void {
            logger.error(`Error measuring state transfer time: ${e instanceof Error ? e.message : String(e): PerformanceMetrics): Promise<void> {
        // Check queue length
        if (metrics.queueLength > 1000: unknown){
            logger.warn('High message queue length detected', {
                queueLength: metrics.queueLength
            })): void {
            logger.warn('High message latency detected', {
                latencyMs: metrics.messageLatencyMs
            })): void { // 1GB
            logger.warn('High memory usage detected', {
                memoryUsageMb: metrics.memoryUsageMb
            })): void {
            logger.warn('High CPU usage detected', {
                cpuUsagePercent: metrics.cpuUsagePercent
            })): void { // More than 10% error rate
            logger.warn('High error rate detected', {
                errorRate
            });
        }
    }
}
