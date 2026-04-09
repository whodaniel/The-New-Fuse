interface RedisConfigType {
    host: string;
    port: number;
    db: number;
    tls?: any;
}

export const redisConfig: RedisConfigType = {
    host: 'localhost',
    port: 6380,  // Using port 6380 as we configured in our Redis server
    db: 0,
    tls: undefined
};