import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
/**
 * Login request DTO
 */
export declare class LoginDto {
    email: string;
    password: string;
    rememberMe?: boolean;
}
/**
 * Register request DTO
 */
export declare class RegisterDto {
    email: string;
    password: string;
    name?: string;
    username?: string;
}
/**
 * Refresh token request DTO
 */
export declare class RefreshTokenDto {
    refreshToken: string;
}
/**
 * Auth response DTO
 */
export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresIn: string;
    user: {
        id: string;
        email: string;
        username?: string;
        name?: string;
        roles: string[];
    };
}
export declare class AuthController {
    private jwtService;
    private configService;
    private readonly logger;
    constructor(jwtService: JwtService, configService: ConfigService);
    /**
     * Login endpoint
     * Authenticates user and returns JWT tokens
     */
    login(loginDto: LoginDto): Promise<AuthResponse>;
    /**
     * Register endpoint
     * Creates a new user account
     */
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    /**
     * Logout endpoint
     * Invalidates the user's refresh token
     */
    logout(user: any): Promise<{
        message: string;
    }>;
    /**
     * Refresh token endpoint
     * Generates new access token using refresh token
     */
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse>;
    /**
     * Get current user endpoint
     * Returns the authenticated user's profile
     */
    getCurrentUser(user: any): Promise<any>;
    /**
     * Generate access and refresh tokens
     */
    private generateTokens;
}
//# sourceMappingURL=auth.controller.d.ts.map