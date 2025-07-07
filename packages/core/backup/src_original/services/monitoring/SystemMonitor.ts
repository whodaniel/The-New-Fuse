import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
    private readonly metricPrefixes: Record<string, string>'
            host: this.configService.get('REDIS_HOST', localhost'): this.configService.get('REDIS_PORT'
            password: this.configService.get('REDIS_PASSWORD'
            db: this.configService.get('REDIS_DB'
                const delay: 'response_time'
            message_count: 'msg_count'
            tool_usage: 'tool_usage'
            error_rate: 'errors'
            agent_load: 'agent_load'
        this.redis.on('error'
        this.redis.on('connect'
            this.logger.log('Connected to Redis'
        const status:failure'
                    avg: await this.getAverageMetric('agent_response_time', hourAgo): await this.getMaxMetric('agent_response_time'
                    total: await this.getTotalMetric('message_count'
                    total: await this.getTotalMetric('error_rate'
                    avg: await this.getAverageMetric('agent_load'
                response_times await this.getMetricHistory(metricType, *'
        const successMetrics  = await this.getMetricHistory(metricType, *';
    private async getToolSuccessRate(since await this.getMetricHistory('tool_usage', success'
        const failureMetrics = await this.getMetricHistory('tool_usage';