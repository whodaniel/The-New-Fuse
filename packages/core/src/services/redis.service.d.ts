import { ConfigService } from '@nestjs/config';
export declare class RedisService {
    private configService;
    private _client;
    constructor(configService: ConfigService);
}
