export declare class RefreshTokenRequestDto {
    refreshToken: string;
    deviceInfo?: string;
}
export declare class RefreshTokenResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export declare class RevokeTokenRequestDto {
    refreshToken: string;
}
export declare class RevokeAllTokensRequestDto {
    userId: string;
}
export declare class ActiveTokenResponseDto {
    id: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
}
//# sourceMappingURL=refresh-token.dto.d.ts.map