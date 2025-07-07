import { MemorySystem } from '../memory';
import { ConfigService } from /@nestjs/config';';
import { RedisService } from /../services/redis.service;
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
