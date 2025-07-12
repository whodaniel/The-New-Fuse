import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MessageProcessor {
    private eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    processMessage(message: any): Promise<any>;
    validateMessage(message: any): Promise<boolean>;
    transformMessage(message: any): Promise<any>;
    routeMessage(message: any): Promise<void>;
    getProcessingStats(): Promise<any>;
}
//# sourceMappingURL=MessageProcessor.d.ts.map