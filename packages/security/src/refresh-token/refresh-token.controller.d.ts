import { RefreshTokenService } from './refresh-token.service';
import { AuthService } from '../auth/auth.service';
import { RefreshTokenRequestDto, RefreshTokenResponseDto, RevokeTokenRequestDto, ActiveTokenResponseDto } from './dto/refresh-token.dto';
interface AuthenticatedRequest {
    user?: {
        id: string;
        email: string;
        roles: string[];
        isActive: boolean;
        sub?: string;
    };
    ip?: string;
    get?(header: string): string | undefined;
}
export declare class RefreshTokenController {
    private readonly refreshTokenService;
    private readonly authService;
    constructor(refreshTokenService: RefreshTokenService, authService: AuthService);
    refreshToken(body: RefreshTokenRequestDto, req: AuthenticatedRequest): Promise<RefreshTokenResponseDto>;
    revokeToken(body: RevokeTokenRequestDto): Promise<{
        message: string;
    }>;
    revokeAllTokens(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    revokeAllUserTokens(userId: string, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    getActiveTokens(req: AuthenticatedRequest): Promise<ActiveTokenResponseDto[]>;
    cleanupExpiredTokens(req: AuthenticatedRequest): Promise<{
        message: string;
        count: number;
    }>;
}
export {};
//# sourceMappingURL=refresh-token.controller.d.ts.map