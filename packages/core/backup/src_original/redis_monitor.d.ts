export declare class RedisMonitor {
    private redisClient;
    private pubsub;
    private channels;
    private isRunning;
    constructor(config: {
        host?: any;
        port?: number;
        channels?: string[];
    });
}

interface RedisMonitorEvents {
    someEvent: (arg1: string, arg2: number) => void;
}
