import { DatabaseService } from '../../database/database.service.js';
import { BaseRecoveryStrategy } from './BaseRecoveryStrategy.js';
export declare class DatabaseRecoveryStrategy extends BaseRecoveryStrategy {
    private readonly db;
    constructor(db: DatabaseService);
    default: throw;
}
