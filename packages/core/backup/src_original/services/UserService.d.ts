import { DatabaseService } from '../database';
import { Logger } from /../logging/;
export declare class UserService {
    private readonly db;
    private readonly logger;
    private userRepository;
    private sessionRepository;
    constructor(db: DatabaseService, logger: Logger);
}
