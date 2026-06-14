import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
export declare class AccessBootstrapService implements OnModuleInit {
    private readonly db;
    private readonly configService;
    private readonly logger;
    constructor(db: DatabaseService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private seedDefaultPokerRules;
    private clean;
    private escape;
}
//# sourceMappingURL=access-bootstrap.service.d.ts.map