import { MemorySystem } from '../memory.js';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service.js';
export declare class PatternRecognizer {
    private readonly memory;
    private readonly configService;
    private readonly redisService;
    private readonly minConfidence;
    private readonly maxPatterns;
    private readonly decayFactor;
    constructor(memory: MemorySystem, configService: ConfigService, redisService: RedisService);
    private getObjectStructure;
}
