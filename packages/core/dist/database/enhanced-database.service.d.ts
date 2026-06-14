import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class EnhancedDatabaseService {
    private eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=enhanced-database.service.d.ts.map