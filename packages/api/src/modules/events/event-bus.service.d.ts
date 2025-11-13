import { LoggingService } from '../../services/logging.service';
export interface BaseEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: any;
}
export declare class EventBus {
    private readonly logger;
    private listeners;
    constructor(logger: LoggingService);
    emit(event: BaseEvent): void;
}
//# sourceMappingURL=event-bus.service.d.ts.map