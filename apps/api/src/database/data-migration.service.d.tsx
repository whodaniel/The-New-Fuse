import { DatabaseService } from './database.adapter.js';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
export declare class DataMigrationService {
    private databaseService;
    private userRepository;
    constructor(databaseService: DatabaseService, userRepository: Repository<User>);
    migrateMongoData(mongoData: any): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
    }>;
    validateMongoData(mongoData: any): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    private convertDataTypes;
    private convertMongoIdToUuid;
}
