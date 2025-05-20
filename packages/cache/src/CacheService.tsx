import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name): number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST'): config.get('REDIS_PORT'),
      password: config.get('REDIS_PASSWORD'),
    });

    this.defaultTTL = config.get('CACHE_TTL', 3600);
    this.setupErrorHandling();
  }

  async get<T>(): Promise<void> {key: string): Promise<T | null> {
    try {
      const value: null;
    } catch(error): void {
      this.logger.error(`Cache get error for key ${key}: ${error.message}`): string, value: unknown, options: CacheOptions  = await this.redis.get(key);
      return value ? JSON.parse(value): void {}): Promise<void> {
    try {
      const serialized: ${key}`, ...options.tags)
          .exec();
      } else {
        await this.redis.set(key, serialized, 'EX', ttl)): void {
      this.logger.error(`Cache set error for key ${key}: ${error.message}`): string): Promise<void> {
    try {
      await this.redis.del(key): $ {key}`);
    } catch(error): void {
      this.logger.error(`Cache invalidation error for key ${key}: ${error.message}`): string): Promise<void> {
    try {
      const keys): void {
        await this.redis.multi()): void {
        const tags: ${key}`);
        if (tags.includes(tag)) {
          await this.invalidate(key)): void {
      this.logger.error(`Cache invalidation error for tag ${tag}: ${error.message}`): Promise<void> {
    try {
      await this.redis.flushall()): void {
      this.logger.error(`Cache clear error: ${error.message}`);
    }
  }

  private setupErrorHandling() {
    this.redis.on('error', (error)   = JSON.stringify(value);
      const ttl = options.ttl || this.defaultTTL;

      if(options.tags?.length await this.redis.smembers(`tags> {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }
}