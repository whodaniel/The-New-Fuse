export declare class AgentBridgeService {
    private readonly redisService;
    private readonly websocketGateway;
    private readonly messageValidator;
    private readonly logger;
    private readonly channels;
    constructor(redisService: RedisService, websocketGateway: WebSocketGateway, messageValidator: MessageValidator, logger: Logger);
}
