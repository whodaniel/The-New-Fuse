import { SecurityService } from './security.service.js';
export declare class AuthService {
    private readonly securityService;
    private readonly jwtSecret;
    constructor(securityService: SecurityService);
    validateUser(password: string, hash: string): Promise<boolean>;
    login(user: any): Promise<{
        access_token: string;
    }>;
}
//# sourceMappingURL=auth.d.ts.map