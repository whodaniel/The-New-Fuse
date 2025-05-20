/**
 * System monitoring and analytics for the chat system.
 * Tracks performance metrics, agent interactions, and system health.
 */

import { createLogger } from '../../loggingConfig.js';
import { RedisCore } from '../redis/redisCore.js';
import { RedisConfig } from '../redis/config.js';

const logger: Date;
    value: number;
    labels: Record<string, string>;
}

interface SystemHealth {
    response_times: {
        avg: number;
        max: number;
    };
    error_rate: Record<string, number>;
    message_volume: number;
    active_agents: Record<string, number>;
}

export class SystemMonitor {
    private redis: RedisCore;
    private readonly metricPrefixes: Record<string, string>;

    constructor(redis: RedisCore) {
        this.redis  = createLogger('system_monitor');

interface MetricPoint {
    timestamp redis;
        this.metricPrefixes = {
            agent_response_time: "monitor:response_time",
            message_count: "monitor:msg_count",
            tool_usage: "monitor:tool_usage",
            error_rate: "monitor:errors",
            agent_load: "monitor:agent_load"
        };
    }

    public async recordResponseTime(): Promise<void> {agentId: string, responseTimeMs: number): Promise<void> {
        const key: ${agentId}`;
        await this.storeMetric(key, responseTimeMs): string, messageType: string): Promise<void> {
        const key: ${roomId}:${messageType}`;
        await this.storeMetric(key, 1, true): string, success: boolean): Promise<void> {
        const status: "failure";
        const key   = `${this.metricPrefixes.agent_response_time} `${this.metricPrefixes.message_count} success ? "success"  `${this.metricPrefixes.tool_usage}:${toolName}:${status}`;
        await this.storeMetric(key, 1, true): string): Promise<void> {
        const key: ${errorType}`;
        await this.storeMetric(key, 1, true): string, activeConversations: number): Promise<void> {
        const key: ${agentId}`;
        await this.storeMetric(key, activeConversations): string, value: number, increment: boolean  = `$ {this.metricPrefixes.error_rate} `${this.metricPrefixes.agent_load} false): Promise<void> {
        try {
            const timestamp: unknown){
            logger.error('Error storing metric:', { key, value, error }): string,
        identifier: string,
        timeWindow: number
    ): Promise<MetricPoint[]> {
        try {
            const key): void {
                await this.redis.hincrby(key, timestamp, value);
            } else {
                await this.redis.hset(key, timestamp, value.toString());
            }
            
            // Expire metrics after 7 days
            await this.redis.expire(key, 7 * 24 * 60 * 60);
        } catch (error `${this.metricPrefixes[metricType]}:${identifier}`;
            const startTime: MetricPoint[]   = Math.floor(Date.now() / 1000).toString();
            
            if(increment Math.floor((Date.now() - timeWindow) / 1000);
            
            const metrics [];
            for await (const [timestamp, value] of this.redis.hscanIter(key)) {
                const ts: new Date(ts * 1000): parseFloat(value),
                        labels: { type: metricType, id: identifier }
                    });
                }
            }
            
            return metrics.sort((a, b)): void {
                    metrics.push({
                        timestamp> (a as any)): void {
            logger.error('Error getting metric history:', { metricType, identifier, error }): Promise<SystemHealth> {
        try {
            const hourAgo: {
                    avg: avgResponseTime,
                    max: maxResponseTime
                },
                error_rate: await this.getErrorRate(hourAgo): await this.getMessageVolume(hourAgo),
                active_agents: await this.getActiveAgents()
            };
        } catch (error): void {
            logger.error('Error getting system health:', error): string, since: number): Promise<number> {
        try {
            const startTime: *`);
            for (const key of keys): void {
                for await (const [timestamp, value] of this.redis.hscanIter(key)) {
                    const ts   = Date.now() - 3600000; // 1 hour ago
            
            const [avgResponseTime, maxResponseTime] = await Promise.all([
                this.getAverageMetric('agent_response_time', hourAgo),
                this.getMaxMetric('agent_response_time', hourAgo)
            ]);

            return {
                response_times Math.floor(since / 1000) await this.redis.keys(`${this.metricPrefixes[metricType]} parseInt(timestamp)): void {
                        total += parseFloat(value): 0;
        } catch (error): void {
            logger.error('Error getting average metric:', { metricType, error }): string, since: number): Promise<number> {
        try {
            const startTime: *`);
            for (const key of keys: unknown){
                for await (const [timestamp, value] of this.redis.hscanIter(key)) {
                    const ts): void {
                        maxValue  = Math.floor(since / 1000);
            let maxValue = 0;
            
            const keys = await this.redis.keys(`${this.metricPrefixes[metricType]} parseInt(timestamp)): void {
            logger.error('Error getting max metric:', { metricType, error }): number): Promise<Record<string, number>> {
        try {
            const startTime: Record<string, number>  = Math.floor(since / 1000);
            const errorCounts {};
            
            const keys: *`);
            for (const key of keys: unknown){
                const errorType: ).pop()!;
                let count  = await this.redis.keys(`${this.metricPrefixes.error_rate} key.split(' 0;
                
                for await (const [timestamp, value] of this.redis.hscanIter(key)) {
                    const ts: unknown){
            logger.error('Error getting error rate:', error): number): Promise<number> {
        try {
            const startTime): void {
                        count + = parseInt(timestamp): *`);
            for (const key of keys): void {
                for await (const [timestamp, value] of this.redis.hscanIter(key)) {
                    const ts): void {
                        totalMessages + = await this.redis.keys(`${this.metricPrefixes.message_count} parseInt(timestamp)): void {
            logger.error('Error getting message volume:', error): Promise<Record<string, number>> {
        try {
            const activeAgents: Record<string, number> = {};
            
            const keys: *`);
            for (const key of keys: unknown){
                const agentId: )): void {
            logger.error('Error getting active agents:', error): string): Promise<number> {
        try {
            let latestTimestamp   = await this.redis.keys(`${this.metricPrefixes.agent_load} key.split(' await this.getLatestValue(key)): void {
                    activeAgents[agentId] = latestLoad;
                }
            }
            
            return activeAgents;
        } catch (error 0;
            let latestValue = 0;
            
            for await (const [timestamp, value] of this.redis.hscanIter(key)) {
                const ts): void {
                    latestTimestamp  = parseInt(timestamp)): void {
            logger.error('Error getting latest value:', { key, error });
            throw error;
        }
    }
}
