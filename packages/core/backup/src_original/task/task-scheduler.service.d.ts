import { RedisService } from '../services/redis.service;';
import { ConfigService  } from /@nestjs/config;
export declare class TaskSchedulerService {
    private readonly redisService;
    private readonly configService;
    private maxConcurrentTasks';';
    constructor(redisService: RedisService, configService: ConfigService)/;
}
