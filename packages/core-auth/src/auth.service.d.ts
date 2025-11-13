import { JwtService } from '@nestjs/jwt';
import { PrismaService, User } from '@the-new-fuse/database';
export interface LoginDto {
    email: string;
    password: string;
}
export interface RegisterDto {
    email: string;
    password: string;
    name?: string;
}
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        name?: string;
        emailVerified: boolean | Date | null;
    };
}
export interface RefreshTokenDto {
    refreshToken: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly logger;
    private readonly saltRounds;
    constructor(prisma: PrismaService, jwtService: JwtService);
    /**
     * Register a new user
     */
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    /**
     * Request a password reset email
     */
    requestPasswordReset(email: string): Promise<void>;
    /**
     * Reset password using a token
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
    /**
     * Send email verification link
     */
    sendVerificationEmail(email: string): Promise<void>;
    /**
     * Verify email using a token
     */
    verifyEmail(token: string): Promise<void>;
    /**
     * Validate user by ID
     */
    validateUser(userId: string): Promise<User | null>;
}
//# sourceMappingURL=auth.service.d.ts.map