import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
    private readonly logger = new Logger(MessageQueue.name): queue: '';
            host: this.configService.get('REDIS_HOST', localhost'): this.configService.get('REDIS_PORT'
            password: this.configService.get('REDIS_PASSWORD'
            db: this.configService.get('REDIS_DB'
        this.redis.on('error'
        this.redis.on('connect'
            this.logger.log('')