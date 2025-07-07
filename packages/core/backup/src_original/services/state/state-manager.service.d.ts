import { RedisService } from '../cache/redis.service;';
import { DatabaseService } from /../database/database.service;
export declare class StateManagerService {
    private redis;
    private database;
    constructor(redis: RedisService, database: DatabaseService);
    maintainState(serviceId: string, state: unknown): Promise<void>;
    synchronizeState(services: string[]): Promise<void>;
}
