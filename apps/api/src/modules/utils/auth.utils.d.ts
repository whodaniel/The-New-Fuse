export declare class AuthUtils {
    /**
     * Hash a password using bcrypt
     */
    static hashPassword(password: string): Promise<string>;
    /**
     * Verify a password against its hash
     */
    static verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate a random salt
     */
    static generateSalt(rounds?: number): Promise<string>;
    /**
     * Hash a password with a custom salt
     */
    static hashPasswordWithSalt(password: string, salt: string): Promise<string>;
    /**
     * Generate a secure random token
     */
    static generateSecureToken(length?: number): string;
    /**
     * Generate a cryptographically secure random token
     */
    static generateSecureTokenCrypto(length?: number): string;
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
        score: number;
    };
}
export declare const hashPassword: typeof AuthUtils.hashPassword;
export declare const verifyPassword: typeof AuthUtils.verifyPassword;
export declare const generateSalt: typeof AuthUtils.generateSalt;
export declare const hashPasswordWithSalt: typeof AuthUtils.hashPasswordWithSalt;
export declare const generateSecureToken: typeof AuthUtils.generateSecureToken;
export declare const generateSecureTokenCrypto: typeof AuthUtils.generateSecureTokenCrypto;
export declare const validatePasswordStrength: typeof AuthUtils.validatePasswordStrength;
//# sourceMappingURL=auth.utils.d.ts.map