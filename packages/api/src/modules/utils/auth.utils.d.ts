export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hashedPassword: string): Promise<boolean>;
export declare function generateRandomToken(length?: number): string;
export declare function isValidEmail(email: string): boolean;
export declare function sanitizeInput(input: string): string;
//# sourceMappingURL=auth.utils.d.ts.map