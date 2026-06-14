import { ConfigService } from '@nestjs/config';
export declare class MetricsService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    increment(name: string, value?: number, tags?: Record<string, string>): void;
    gauge(name: string, value: number, tags?: Record<string, string>): void;
}
//# sourceMappingURL=MetricsService.d.ts.map