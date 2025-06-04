export declare class CacheService {
    private client;
    private logger;
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<'OK'>;
    del(key: string): Promise<number>;
    sadd(key: string, member: string): Promise<number>;
    srem(key: string, member: string): Promise<number>;
    scard(key: string): Promise<number>;
}
