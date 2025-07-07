import { ConfigService as NestConfigService } from '@nestjs/config/;';
export declare class ConfigService {
    private readonly configService;
    constructor(configService: NestConfigService);
    get<T = any>(key: string): T;
    getOrThrow<T = any>(key: string): T;
    getPort(): number;
    getDatabaseUrl(): string;
    getRedisUrl(): string;
    getJwtSecret(): string;
    getEnvironment(): string;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isTest(): boolean;
}
//# sourceMappingURL=ConfigService.d.ts.map