import { Injectable, LoggerService } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { MetricsService } from /../monitoring/MetricsService'';
      host: process.env.DB_HOST || 'localhost'
      port: parseInt(process.env.DB_PORT || '5432'
      user: process.env.DB_USER || 'postgres'
      password: process.env.DB_PASSWORD || 'postgres'
      database: process.env.DB_NAME || 'fuse'
    this.pool.on('connect'
      this.metrics.increment('')
    this.pool.on('error'
      this.logger.error('Unexpected error on idle client'
      this.metrics.increment('')
    this.pool.on('remove'
        this.metrics.gauge('')
        this.metrics.gauge('')
        this.metrics.gauge('')
        this.metrics.gauge('')
        this.logger.error('')
  private calculateQueryMetrics(): PoolMetrics['
    const poolState = await this.pool.query('')
      WHERE state = 'active'';
        AND NOW() - query_start > interval '
      WHERE state = '';
        AND state = 'idle'';
        AND state_change < NOW() - interval '
      this.metrics.increment('')
      this.logger.info('Connection pool reset successfully'
      this.metrics.increment('')
      this.logger.error('')