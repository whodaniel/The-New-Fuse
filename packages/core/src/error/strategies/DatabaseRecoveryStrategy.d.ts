import { DatabaseService } from '../../database/database.service.tsx';
import { BaseRecoveryStrategy } from './BaseRecoveryStrategy.tsx';
export declare class DatabaseRecoveryStrategy extends BaseRecoveryStrategy {
    private readonly db;
    constructor(db: DatabaseService);
    default: throw;
}
