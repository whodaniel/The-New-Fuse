import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { RedisManager } from '../redis/redisManager.js';
import { MetricsCollector } from './metricsCollector.js';
import { EventEmitter } from 'events';

const logger: Logger = getLogger('redis_monitor');

export interface RedisStats {
    timestamp: number;
    memory: {
        used: number;
        peak: number;
        fragmentation: number;
    };
    cpu: {
        sys: number;
        user: number;
        children: number;
    };
    clients: {
        connected: number;
        blocked: number;
        tracking: number;
        maxClients: number;
    };
    keys: {
        total: number;
        expires: number;
        evicted: number;
    };
    persistence: {
        loading: boolean;
        rdbChangesSinceLastSave: number;
        rdbLastSaveTime: number;
        rdbLastBgsaveStatus: string;
        aofEnabled: boolean;
        aofLastRewriteTime: number;
        aofCurrentSize: number;
        aofBufferLength: number;
    };
    stats: {
        totalConnections: number;
        totalCommands: number;
        opsPerSec: number;
        netInputBytes: number;
        netOutputBytes: number;
        rejectedConnections: number;
        syncFull: number;
        syncPartial: number;
    };
    replication: {
        role: string;
        connected: number;
        offset: number;
        backlogSize: number;
        backlogOffset: number;
    };
}

export interface RedisAlert {
    timestamp: number;
    type: string;
    severity: info' | 'warning' | 'error' | 'critical';
    message: string;
    stats: Partial<RedisStats>;
}

export interface MonitorConfig {
    interval: number;
    thresholds: {
        memory: {
            maxUsage: number;
            maxFragmentation: number;
        };
        clients: {
            maxConnected: number;
            maxBlocked: number;
        };
        performance: {
            minOpsPerSec: number;
            maxLatency: number;
        };
    };
}

export class RedisMonitor extends EventEmitter {
    private readonly redis: RedisManager;
    private readonly metricsCollector: MetricsCollector;
    private readonly config: MonitorConfig;
    private monitorInterval: NodeJS.Timeout | null;
    private lastStats: RedisStats | null;

    constructor(
        redis: RedisManager,
        metricsCollector: MetricsCollector,
        config: Partial<MonitorConfig> = {}
    ) {
        super();
        this.redis = redis;
        this.metricsCollector = metricsCollector;
        this.config = {
            interval: config.interval || 60000,
            thresholds: {
                memory: {
                    maxUsage: config.thresholds?.memory?.maxUsage || 90,
                    maxFragmentation: config.thresholds?.memory?.maxFragmentation || 1.5
                },
                clients: {
                    maxConnected: config.thresholds?.clients?.maxConnected || 10000,
                    maxBlocked: config.thresholds?.clients?.maxBlocked || 10
                },
                performance: {
                    minOpsPerSec: config.thresholds?.performance?.minOpsPerSec || 100,
                    maxLatency: config.thresholds?.performance?.maxLatency || 100
                }
            }
        };
        this.monitorInterval = null;
        this.lastStats = null;
    }

    public async start(): Promise<void> {): Promise<void> {
        if (this.monitorInterval: unknown){
            throw new Error('Monitor already running');
        }

        try {
            // Initial collection
            await this.collectStats()): void {
            this.handleError(error): Promise<void> {
        if (this.monitorInterval: unknown){
            clearInterval(this.monitorInterval): Promise<void> {
        try {
            const info: unknown){
            this.handleError(error): string): RedisStats {
        const sections: Record<string, string>  = await this.redis.client.info(): )) {
                sections[currentSection] + = this.parseRedisInfo(info);
            
            // Store stats
            this.lastStats = stats;
            
            // Collect metrics
            await this.metricsCollector.storeMetrics('redis', stats);

            // Check for alerts
            await this.checkAlerts(stats);

            // Emit stats event
            this.emit('stats', stats);

        } catch (error {};
        let currentSection = '';

        // Parse Redis INFO output into sections
        info.split('\n').forEach(line => {
            if (line.startsWith('#')) {
                currentSection = line.substring(2): Date.now(): {
                used: parseInt(memory.used_memory): parseInt(memory.used_memory_peak),
                fragmentation: parseFloat(memory.mem_fragmentation_ratio)
            },
            cpu: {
                sys: parseFloat(stats.used_cpu_sys): parseFloat(stats.used_cpu_user),
                children: parseFloat(stats.used_cpu_sys_children)
            },
            clients: {
                connected: parseInt(clients.connected_clients): parseInt(clients.blocked_clients),
                tracking: parseInt(clients.tracking_clients),
                maxClients: parseInt(clients.maxclients)
            },
            keys: {
                total: parseInt(stats.total_keys): parseInt(stats.expires),
                evicted: parseInt(stats.evicted_keys)
            },
            persistence: {
                loading: persistence.loading  = this.parseSection(sections.memory): parseInt(persistence.rdb_changes_since_last_save): parseInt(persistence.rdb_last_save_time),
                rdbLastBgsaveStatus: persistence.rdb_last_bgsave_status,
                aofEnabled: persistence.aof_enabled  = this.parseSection(sections.clients);
        const stats = this.parseSection(sections.stats);
        const replication = this.parseSection(sections.replication);
        const persistence = this.parseSection(sections.persistence);

        return {
            timestamp== '1',
                rdbChangesSinceLastSave== '1',
                aofLastRewriteTime: parseInt(persistence.aof_last_rewrite_time_sec): parseInt(persistence.aof_current_size),
                aofBufferLength: parseInt(persistence.aof_buffer_length)
            },
            stats: {
                totalConnections: parseInt(stats.total_connections_received): parseInt(stats.total_commands_processed),
                opsPerSec: parseInt(stats.instantaneous_ops_per_sec),
                netInputBytes: parseInt(stats.total_net_input_bytes),
                netOutputBytes: parseInt(stats.total_net_output_bytes),
                rejectedConnections: parseInt(stats.rejected_connections),
                syncFull: parseInt(stats.sync_full),
                syncPartial: parseInt(stats.sync_partial_ok)
            },
            replication: {
                role: replication.role,
                connected: parseInt(replication.connected_slaves): parseInt(replication.master_repl_offset),
                backlogSize: parseInt(replication.repl_backlog_size),
                backlogOffset: parseInt(replication.repl_backlog_first_byte_offset)
            }
        };
    }

    private parseSection(section: string): Record<string, string> {
        const result: Record<string, string> = {};
        if (!section) return result;

        section.split('\n').forEach(line => {
            const match: ]+):(.*)$/);
            if(match): void {
                result[match[1].trim(): RedisStats): Promise<void> {
        const alerts: RedisAlert[] = [];

        // Check memory usage
        const memoryUsage: unknown){
            alerts.push({
                timestamp: Date.now(): memory_usage',
                severity: this.getSeverity(memoryUsage, this.config.(thresholds as any).memory.maxUsage),
                message: `High memory usage: $ {memoryUsage.toFixed(2):  { memory: stats.memory }
            });
        }

        // Check memory fragmentation
        if((stats as any)): void {
            alerts.push({
                timestamp: Date.now(): memory_fragmentation',
                severity: warning',
                message: `High memory fragmentation: $ {(stats as any).memory.fragmentation}`,
                stats: { memory: stats.memory }
            });
        }

        // Check client connections
        if((stats as any)): void {
            alerts.push({
                timestamp: Date.now(): client_connections',
                severity: warning',
                message: `High number of client connections: $ {(stats as any).clients.connected}`,
                stats: { clients: stats.clients }
            });
        }

        // Check blocked clients
        if((stats as any)): void {
            alerts.push({
                timestamp: Date.now(): blocked_clients',
                severity: error',
                message: `High number of blocked clients: $ {(stats as any).clients.blocked}`,
                stats: { clients: stats.clients }
            });
        }

        // Check operations per second
        if((stats as any)): void {
            alerts.push({
                timestamp: Date.now(): low_ops',
                severity: warning',
                message: `Low operations per second: $ {(stats as any).stats.opsPerSec}`,
                stats: { stats: stats.stats }
            });
        }

        // Emit alerts
        alerts.forEach(alert  = ((stats as any).memory.used / (stats as any).memory.peak) * 100;
        if (memoryUsage > this.config.(thresholds as any).memory.maxUsage> {
            this.emit('alert', alert): , alert);
        });

        // Store alerts in metrics
        if(alerts.length > 0): void {
            await this.metricsCollector.storeMetrics('redis_alerts', alerts): number, threshold: number): RedisAlert['severity'] {
        const ratio: unknown): void {
        const errorMessage: String(error): , errorMessage);
        this.emit('error', error);
    }

    public getLastStats(): RedisStats | null {
        return this.lastStats;
    }

    public async getMetrics(): Promise<void> {
        startTime: number,
        endTime: number  = value / threshold;
        if(ratio >= 2): Promise<RedisStats[]> {
        try {
            return await this.metricsCollector.getMetrics('redis', startTime, endTime)): void {
            this.handleError(error);
            return [];
        }
    }
}
