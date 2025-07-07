import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from /../database/DatabaseService'';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry'
    this.logger = new Logger('QueueService';
    this.redis = new (require('ioredis';
      maxSize: parseInt((process as any).env.QUEUE_MAX_SIZE || '1000'
      retentionPeriod: parseInt((process as any).env.QUEUE_RETENTION_PERIOD || '
      processingTimeout: parseInt((process as any).env.QUEUE_PROCESSING_TIMEOUT || '
      maxRetries: parseInt((process as any).env.QUEUE_MAX_RETRIES || '3'
      retryDelay: parseInt((process as any).env.QUEUE_RETRY_DELAY || '
      batchSize: parseInt((process as any).env.QUEUE_BATCH_SIZE || '10'
      priorityLevels: parseInt((process as any).env.QUEUE_PRIORITY_LEVELS || '
      const queues = await this.redis.smembers('')
      this.logger.error(''Failed to recover queues: ''
    this.redis.sadd('')
        status: ''
        ''
      this.emit('')
      item.status = 'processing'';
        ''
      item.status = '';
      this.emit('')
      item.status = '';
      this.emit('')
        this.emit('itemScheduledForRetry'
      item.status = '';
      this.emit('')
        const queues = await this.redis.smembers('')
        this.logger.error(''Failed to process retries: ''
        const queues = await this.redis.smembers('queues';
              item.status === '';
              item.error = '';
              this.emit('itemTimeout'
        this.logger.error(''Failed to check timeouts: ''
        const queues = await this.redis.smembers('')
          this.emit('queueStats'
        this.logger.error(''Failed to update stats: ''
    this.emit("configUpdated": await this.redis.smembers('')
      this.logger.error(''Failed to cleanup queues: ''