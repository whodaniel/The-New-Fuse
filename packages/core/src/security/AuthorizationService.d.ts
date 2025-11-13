import { OnModuleInit } from '@nestjs/common';
import { LoggingService } from '../services/LoggingService';
import { ConfigService } from '../config/ConfigService';
import { UserService } from '../services/UserService';
export interface Role {
    name: string;
    permissions: string[];
}
export declare class AuthorizationService implements OnModuleInit {
    private readonly logger;
    private readonly configService;
    private readonly userService;
    private roles;
    constructor(logger: LoggingService, configService: ConfigService, userService: UserService);
    onModuleInit(): void;
    private loadRoles;
    const userRole: Role | undefined;
    if(: any, userRole: any): boolean;
}
export default AuthorizationService;
//# sourceMappingURL=AuthorizationService.d.ts.map