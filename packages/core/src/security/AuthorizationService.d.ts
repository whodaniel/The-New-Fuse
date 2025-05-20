import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class AuthorizationService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private roles;
    private permissions;
    private policies;
    private userRoles;
    private userPermissions;
    constructor();
    catch(error: unknown): void;
    for(: any, policy: any, of: any, policies: unknown): void;
}
