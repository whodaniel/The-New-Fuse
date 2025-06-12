import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService.tsx';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly redis;
    constructor(configService: ConfigService);
}
