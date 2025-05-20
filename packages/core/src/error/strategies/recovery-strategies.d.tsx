import { DatabaseService } from '../../database/database.service.js';
import { NetworkService } from '../../network/network.service.js';
import { CacheService } from '../../cache/cache.service.js';
export declare class RecoveryStrategies {
    private readonly db;
    private readonly network;
    private readonly cache;
    constructor(db: DatabaseService, network: NetworkService, cache: CacheService);
    handleDatabaseError(): Promise<void>;
}
