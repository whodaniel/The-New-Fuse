import { EventBus } from '../events/event-bus.service.js';
import { LoggingService } from '../logging/logging.service.js';
export declare class BridgeService {
    private eventBus;
    private logger;
    constructor(eventBus: EventBus, logger: LoggingService);
    connectServices(): Promise<void>;
}
