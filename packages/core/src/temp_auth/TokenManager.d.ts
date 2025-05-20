import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
import { AuthConfig } from './AuthTypes.js';
export declare class TokenManager extends EventEmitter {
    private readonly jwtService;
    private readonly db;
    private readonly config;
    private logger;
    private redis;
    private readonly tokenBlacklist;
    constructor(jwtService: JwtService, db: DatabaseService, config: AuthConfig);
}
