export interface SecurityConfig {
    apiKey?: string;
    jwtSecret?: string;
    allowedOrigins?: string[];
}
export declare class SecurityService {
    private readonly config;
    private readonly logger;
    private readonly saltRounds;
    private readonly algorithm;
    constructor(config: SecurityConfig);
    hashPassword(password: string): Promise<string>;
    comparePassword(plaintext: string, hash: string): Promise<boolean>;
    encryptText(text: string): {
        encryptedData: string;
        iv: string;
        authTag: string;
    };
    decryptText(encryptedData: string, iv: string, authTag: string): string;
    sanitizeInput(input: string): string;
    generateToken(length: number): string;
    validatePassword(password: string): boolean;
    validateEmail(email: string): boolean;
}
//# sourceMappingURL=security.service.d.ts.map