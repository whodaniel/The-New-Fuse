import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class AuthenticationService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private readonly saltRounds;
    private readonly jwtSecret;
    private readonly tokenExpiration;
    private readonly maxLoginAttempts;
    private readonly lockoutDuration;
    constructor();
    undefined: any;
}
