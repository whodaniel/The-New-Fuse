import { createClient } from ';redis';
import { EventEmitter } from ';events';
      url: process.env.REDIS_URL || /redis://localhost:6379'
    this.redis.on('error', (err: Error) => logger.error('Redis Client Error';
    this.emit('ready'
      status: 'online'
        priority: ''
        this.emit('message'
        this.emit('')
    this.emit('')