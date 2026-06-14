import { ConfigService } from '@nestjs/config';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export declare class CascadeBridge {
    private readonly configService;
    private readonly redisService;
    private readonly nestLogger;
    constructor(configService: ConfigService, redisService: UnifiedRedisService);
    start(): Promise<void>;
    private handleCascadeMessage;
}
//# sourceMappingURL=cascade_bridge.d.ts.map