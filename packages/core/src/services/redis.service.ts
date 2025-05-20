import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private _client: Redis;

    constructor(private configService: ConfigService) {
        this._client = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            keyPrefix: 'fuse:',
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this._client.on('error', (err: Error) => {
            console.error('Redis connection error:', err);
        });

        this._client.on('connect', () => {
            console.log('Connected to Redis');
        });
    }

    get client(): Redis {
        return this._client;
    }

    async get(key: string): Promise<string | null> {
        return this._client.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if(ttl) {
            await this._client.set(key, value, 'EX', ttl);
        } else {
            await this._client.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this._client.del(key);
    }

    async hset(key: string, field: string | object, value?: string): Promise<void> {
        if(typeof field === 'object') {
            await this._client.hset(key, field);
        } else {
            await this._client.hset(key, field, value!);
        }
    }

    async hgetall(key: string): Promise<Record<string, string>> {
        return this._client.hgetall(key);
    }

    async hdel(key: string, ...fields: string[]): Promise<number> {
        return this._client.hdel(key, ...fields);
    }

    async zadd(key: string, score: number, member: string): Promise<number> {
        return this._client.zadd(key, score, member);
    }

    async zrem(key: string, ...members: string[]): Promise<number> {
        return this._client.zrem(key, ...members);
    }

    async zrange(key: string, start: number, stop: number): Promise<string[]> {
        return this._client.zrange(key, start, stop);
    }

    async zpopmin(key: string): Promise<string[]> {
        return this._client.zpopmin(key);
    }

    async zcard(key: string): Promise<number> {
        return this._client.zcard(key);
    }

    async keys(pattern: string): Promise<string[]> {
        return this._client.keys(pattern);
    }

    async flushdb(): Promise<void> {
        await this._client.flushdb();
    }

    async quit(): Promise<void> {
        await this._client.quit();
    }
}
