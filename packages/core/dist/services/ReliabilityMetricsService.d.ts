import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ReliabilityMetricsService {
    private readonly eventEmitter;
    private readonly logger;
    private negotiationAttempts;
    private negotiationSuccesses;
    private schemaErrors;
    constructor(eventEmitter: EventEmitter2);
    private setupEventListeners;
    getNegotiationSuccessRate(): number;
    getSchemaErrorRate(): number;
}
//# sourceMappingURL=ReliabilityMetricsService.d.ts.map