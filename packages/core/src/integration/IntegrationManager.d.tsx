export declare class IntegrationManager {
    private readonly redis;
    private readonly logger;
    private readonly connectedComponents;
    constructor(redis: RedisService, logger: LoggerService);
    registerComponent(): Promise<void>;
}
