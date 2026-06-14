import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateToken(userId: string): Promise<string>;
    validateUser(token: string): Promise<any>;
    refreshToken(token: string): Promise<string | null>;
}
//# sourceMappingURL=auth.service.d.ts.map