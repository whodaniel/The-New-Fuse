import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/ConfigService';
import { LoggingService } from '../services/LoggingService';
import { UserService } from '../services/UserService';
import { SafeUser } from '../types/user.types';
export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
}
export interface LoginResult {
    accessToken: string;
    user: SafeUser;
}
export declare class AuthenticationService {
    private readonly logger;
    private readonly configService;
    private readonly userService;
    private readonly jwtService;
    private readonly jwtSecret;
    private readonly jwtExpiresIn;
    constructor(logger: LoggingService, configService: ConfigService, userService: UserService, jwtService: JwtService);
    /**
     * Validates user credentials.
     * @param username The username to validate.
     * @param pass The password to validate.
     * @returns The user object if validation is successful, otherwise null.
     */
    validateUser(username: string, pass: string): Promise<SafeUser | null>;
    /**
     * Verifies a JWT.
     * @param token The JWT to verify.
     * @returns The payload of the JWT if verification is successful.
     */
    verifyToken(token: string): Promise<JwtPayload>;
    /**
     * Refreshes a JWT.
     * @param user The user object from an existing valid token.
     * @returns A new access token.
     */
    refreshToken(user: JwtPayload): Promise<string>;
}
//# sourceMappingURL=AuthenticationService.d.ts.map