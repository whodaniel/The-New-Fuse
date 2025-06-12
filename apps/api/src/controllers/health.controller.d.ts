import { Repository } from 'typeorm';
import { User } from '../entities/User';
export declare class HealthController {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    check(): Promise<{
        status: string;
        database: string;
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        database: string;
        error: any;
        timestamp: string;
    }>;
}
