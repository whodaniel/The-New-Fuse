interface ValidationResult {
    isValid: boolean;
    message?: string;
}
export declare const generateVerificationCode: (length?: number) => string;
export declare const validatePassword: (password: string) => ValidationResult;
export declare const generateBackupCodes: (count?: number) => string[];
export declare const generateToken: (length?: number) => string;
export declare const compareHashes: (a: string, b: string) => boolean;
export {};
//# sourceMappingURL=auth.utils.d.ts.map