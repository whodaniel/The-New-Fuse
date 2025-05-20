import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService.js';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly redis;
    constructor(configService: ConfigService);
}
