interface Token {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    type: 'access' | 'refresh';
}
export declare class TokenManager {
    private readonly logger;
    private tokens;
    constructor();
    generateToken(userId: string, type?: 'access' | 'refresh'): Promise<Token>;
    validateToken(tokenString: string): Promise<Token | null>;
    revokeToken(tokenString: string): Promise<boolean>;
    refreshToken(refreshTokenString: string): Promise<Token | null>;
    revokeAllUserTokens(userId: string): Promise<void>;
    cleanExpiredTokens(): Promise<number>;
}
export {};
//# sourceMappingURL=TokenManager.d.ts.map