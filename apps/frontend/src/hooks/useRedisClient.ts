import react_1 from 'react';
import redisClient_1 from '../core/redis/redisClient';
export const useRedisClient = (): any => {
    const [client, setClient] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const initializeClient = async () => {
            const newClient = new redisClient_1.RedisClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            });
            await newClient.connect();
            setClient(newClient);
        };
        initializeClient();
        return () => {
            if (client) {
                client.disconnect();
            }
        };
    }, []);
    const subscribe = async (channel, callback) => {
        if (!client)
            return;
        await client.subscribe(channel, callback);
    };
    const publish = async (channel, message) => {
        if (!client)
            return;
        await client.publish(channel, message);
    };
    const getClient = async () => {
        if (!client) {
            throw new Error('Redis client not initialized');
        }
        return client;
    };
    return {
        subscribe,
        publish,
        getClient,
    };
};

;
