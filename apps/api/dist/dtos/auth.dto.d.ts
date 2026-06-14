export declare class LoginDto {
    email: string;
    password: string;
    cfTurnstileToken?: string;
}
export declare class RegisterDto {
    inviteCode?: string;
    username?: string;
    email: string;
    password: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    cfTurnstileToken?: string;
}
export declare class TokenDto {
    accessToken: string;
    refreshToken: string;
}
export declare class GenerateInviteCodeDto {
    label?: string;
    federationId?: string;
    maxUses?: number;
    expiresAt?: string;
}
export declare class SupabaseAuthDto {
    accessToken: string;
    inviteCode?: string;
    refreshToken?: string;
}
//# sourceMappingURL=auth.dto.d.ts.map