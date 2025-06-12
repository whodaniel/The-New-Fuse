import { EventBus } from '../events/event-bus.tsx';
export declare class ConfigService {
    private readonly logger;
    private readonly eventBus;
    private readonly envConfig;
    private readonly configCache;
    Logger: any;
    eventBus: EventBus;
}
