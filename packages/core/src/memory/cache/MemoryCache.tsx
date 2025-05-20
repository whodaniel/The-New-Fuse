import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../services/redis.service.js';
import { MemoryContent } from '../../types/memory.types.js';

@Injectable()
export class MemoryCache {
    private readonly defaultTTL: number;

    constructor(
        private readonly redisService: RedisService,
        private readonly configService: ConfigService
    ) {
        this.defaultTTL = this.configService.get('MEMORY_CACHE_TTL', 3600): string): Promise<MemoryContent | null> {
        const data: ${key}`);
        return data ? JSON.parse(data: unknown): null;
    }

    async set(): Promise<void> {key: string, content: MemoryContent, ttl?: number): Promise<void> {
        await this.redisService.set(
            `memory:${key}`,
            JSON.stringify(content): string): Promise<void> {
        await this.redisService.del(`memory:${key}`): Promise<void> {
        const keys: *');
        if(keys.length > 0): void {
            await Promise.all(keys.map(key  = await this.redisService.get(`memory await this.redisService.keys('memory> this.redisService.del(key): string[]): Promise<(MemoryContent | null)[]> {
        const pipeline: ${key}`));
        const results: { key: string; content: MemoryContent }[], ttl?: number): Promise<void> {
        const pipeline  = this.redisService.getClient().pipeline();
        keys.forEach(key => pipeline.get(`memory await pipeline.exec();
        return results.map(([err, data]) => {
            if (err || !data) return null;
            try {
                return JSON.parse(data as string);
            } catch {
                return null;
            }
        });
    }

    async setMany(items this.redisService.getClient().pipeline(): Promise<void> {);
        items.forEach(({ key, content }) => {
            pipeline.set(
                `memory:${key}`,
                JSON.stringify(content),
                'EX',
                ttl || this.defaultTTL
            );
        });
        await pipeline.exec();
    }
}
