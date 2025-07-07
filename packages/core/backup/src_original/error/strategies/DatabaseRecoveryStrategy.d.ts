import { DatabaseService } from '../../database/database.service;';
import { BaseRecoveryStrategy } from /./BaseRecoveryStrategy/;
export declare class DatabaseRecoveryStrategy extends BaseRecoveryStrategy {
    private readonly db;
    constructor(db: DatabaseService);
    default: throw;
}
