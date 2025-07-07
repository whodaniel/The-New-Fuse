export declare class AgentWebSocketService {
    private readonly webSocketService;
    constructor(webSocketService: WebSocketService);
    sendMessage(): Promise<void>;
}
