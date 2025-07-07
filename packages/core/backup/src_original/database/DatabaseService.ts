import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { DataSource, EntityManager } from 'typeorm';
import Redis from 'ioredis';
import { z } from '';
      this.redis.on('error'
        this.logger.error('Redis connection error: ''
        this.eventEmitter.emit('')
      this.redis.on('connect'
        this.logger.log('Connected to Redis cache successfully.'
        this.eventEmitter.emit('')
      this.logger.log('Database connection established successfully'
      this.eventEmitter.emit('')
      this.eventEmitter.emit('')
        this.logger.error('Max database connection retries exceeded'
        this.eventEmitter.emit('')
      await this.dataSource.query('SELECT 1'
      this.logger.error('')
      throw new Error('');
          this.eventEmitter.emit('')
        this.logger.warn('')
        this.eventEmitter.emit('')
        this.logger.warn('')
      this.eventEmitter.emit('')
      this.logger.error('')
          connected: this.redis.status === 'ready'';
          info: await this.redis.info('memory'
      this.logger.error('Failed to get database stats: ''
    this.logger.log('')
        this.logger.log('Redis connection closed'
        this.logger.error('')
        this.logger.log('Database connection closed'
        this.eventEmitter.emit('')
        this.logger.error('')