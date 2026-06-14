var ClientState;
(function (ClientState) {
    ClientState["INITIALIZING"] = "INITIALIZING";
    ClientState["BROADCASTING"] = "BROADCASTING";
    ClientState["LISTENING"] = "LISTENING";
})(ClientState || (ClientState = {}));
export class SimpleWebSocketClient {
    constructor(config, logger, redisService) {
        this.state = ClientState.INITIALIZING;
        this.config = config;
        this.logger = logger;
        this.redisService = redisService;
    }
    async initialize() {
        try {
            this.state = ClientState.LISTENING;
            this.logger.info('WebSocket client initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize WebSocket client', { error });
            throw error;
        }
    }
    async sendMessage(channel, message) {
        try {
            await this.redisService.publish(channel, JSON.stringify(message));
            this.logger.info('Message sent successfully', { channel });
        }
        catch (error) {
            this.logger.error('Failed to send message', { error, channel });
            throw error;
        }
    }
    async subscribe(channel, callback) {
        try {
            await this.redisService.subscribe(channel, (message) => {
                try {
                    const messageStr = typeof message.message === 'string' ? message.message : JSON.stringify(message.message);
                    const parsedMessage = JSON.parse(messageStr);
                    callback(parsedMessage);
                }
                catch (error) {
                    this.logger.error('Failed to parse message', { error, message: message.message });
                }
            });
            this.logger.info('Subscribed to channel', { channel });
        }
        catch (error) {
            this.logger.error('Failed to subscribe to channel', { error, channel });
            throw error;
        }
    }
    async disconnect() {
        try {
            this.logger.info('WebSocket client disconnected');
        }
        catch (error) {
            this.logger.error('Error during disconnect', { error });
        }
    }
}
//# sourceMappingURL=simple_client.js.map