import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class NotificationService {
    private readonly eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    private initializeEventListeners;
    private handleRooOutput;
    private handleRooError;
}
//# sourceMappingURL=NotificationService.d.ts.map