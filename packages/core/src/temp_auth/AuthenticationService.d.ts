import { EventEmitter } from 'events';
import { DatabaseService } from '@the-new-fuse/database';
import { TokenManager } from './TokenManager.js';
import { UserService } from '../services/UserService.js';
import { AuthConfig } from './AuthTypes.js';
export declare class AuthenticationService extends EventEmitter {
    private readonly config;
    private readonly tokenManager;
    private readonly userService;
    private readonly db;
    private logger;
    private redis;
    constructor(config: AuthConfig, tokenManager: TokenManager, userService: UserService, db: DatabaseService);
    private recordLoginAttempt;
}
