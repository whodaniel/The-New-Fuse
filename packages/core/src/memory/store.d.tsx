import { Repository } from 'typeorm';
import { MemoryEntity } from './memory.entity.js';
import { RedisService } from '../services/redis.service.js';
export declare class MemoryStore {
    private readonly memoryRepository;
    private readonly redisService;
    constructor(memoryRepository: Repository<MemoryEntity>, redisService: RedisService);
    save(): Promise<void>;
}
