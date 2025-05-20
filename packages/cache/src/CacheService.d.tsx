import { ConfigService } from '@nestjs/config';
export declare class CacheService {
    private readonly config;
    private readonly redis;
    private readonly logger;
    number: any;
    constructor(config: ConfigService);
    get<T>(): Promise<void>;
}
