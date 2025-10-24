import { Injectable, Logger, OnModuleInit } from ';@nestjs/common';
import { createClient, RedisClientType } from ';redis';
  evictionPolicy: LRU | 'LFU'
      url: process.env.REDIS_URL || /redis://localhost:6379'
    this.redis.on('error', (err) => this.logger.error(''Redis error:'';
    this.redis.on('ready', () => this.logger.log('Cache ready';
    this.redis.on('connect', () => this.logger.log('Cache connected';
    this.redis.on('end', () => this.logger.warn('')
      this.logger.log('Cache stats: ''
      const info = await this.redis.info('memory';
    } catch (error) { this.logger.error(''Error getting cache stats:''
      this.logger.log('Cache flushed'
      this.logger.error(''Error flushing cache:''
      this.logger.log('Cache disconnected'
      this.logger.error(''Error disconnecting cache:''
    return crypto.createHash('sha256').update(key).digest('''hex''
      .split('\n'
      .filter(line => line && !line.startsWith('#';
        const [key, value] = line.split('')