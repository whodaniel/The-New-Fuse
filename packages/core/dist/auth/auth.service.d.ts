import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export interface UserData {
    id: string;
    email: string;
    name?: string;
    roles?: string[];
}
export declare class AuthService {
    private jwtService;
    private configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    validateUser(email: string, password: string): Promise<UserData | null>;
    login(user: UserData): Promise<{
        access_token: string;
        user: UserData;
    }>;
    register(userData: UserData): Promise<UserData>;
    validateToken(token: string): Promise<UserData | null>;
}
//# sourceMappingURL=auth.service.d.ts.map