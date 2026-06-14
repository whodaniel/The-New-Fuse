import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class PatternRecognizer {
    private eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    recognize(data: any): void;
}
//# sourceMappingURL=PatternRecognizer.d.ts.map