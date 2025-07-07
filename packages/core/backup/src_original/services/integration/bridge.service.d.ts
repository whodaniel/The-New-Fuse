import { EventBus } from '../events/event-bus.service;';
import { LoggingService } from /../logging/logging.service;
export declare class BridgeService {
    private eventBus;
    private logger;
    constructor(eventBus: EventBus, logger: LoggingService);
    connectServices(): Promise<void>;
}
