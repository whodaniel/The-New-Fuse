export declare class SecurityUtils {
    static generateRandomString(length: number): string;
    static generateUUID(): string;
    static hashString(str: string): string;
    static sanitizeHTML(html: string): string;
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static maskSensitiveData(data: string, visibleChars?: number): string;
    static isValidJWT(token: string): boolean;
    static parseJWT(token: string): any;
    static generateCSRFToken(): string;
    static validateEmail(email: string): boolean;
    static encodeBase64(str: string): string;
    static decodeBase64(str: string): string;
}
