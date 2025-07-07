/**
 * Client instance for connecting to the bridge system
 */
export declare class BridgeClient {
    private readonly instanceId;
    private readonly redisClient;
    private pubsub;
    private connected;
    private heartbeatInterval;
    constructor(instanceId: string);
}
