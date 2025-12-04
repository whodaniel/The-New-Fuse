export declare class SecurityUtils {
    static generateRandomString(length: any): string;
    static generateUUID(): `${string}-${string}-${string}-${string}-${string}`;
    static hashString(str: any): Promise<string>;
    static sanitizeHTML(html: any): string;
    static validatePassword(password: any): {
        isValid: boolean;
        errors: string[];
    };
    static maskSensitiveData(data: any, visibleChars?: number): string;
    static isValidJWT(token: any): boolean;
    static parseJWT(token: any): any;
    static generateCSRFToken(): string;
    static validateEmail(email: any): boolean;
    static encodeBase64(str: any): string;
    static decodeBase64(str: any): string;
}
