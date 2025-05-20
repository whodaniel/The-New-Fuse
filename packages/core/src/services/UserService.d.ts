import { DatabaseService } from '../database.js';
import { Logger } from '../logging.js';
export declare class UserService {
    private readonly db;
    private readonly logger;
    private userRepository;
    private sessionRepository;
    constructor(db: DatabaseService, logger: Logger);
}
