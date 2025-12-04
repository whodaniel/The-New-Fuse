/**
 * Frontend Input Sanitization and Security Utilities
 * Provides comprehensive client-side security measures
 */
export interface SanitizationOptions {
    maxLength?: number;
    allowedChars?: string;
    stripHtml?: boolean;
    escapeHtml?: boolean;
    validateEmail?: boolean;
    validatePhone?: boolean;
    validateUrl?: boolean;
    trimWhitespace?: boolean;
}
export declare class ClientSecurityUtils {
    /**
     * Sanitize HTML content to prevent XSS
     */
    static sanitizeHTML(html: string): string;
    /**
     * Sanitize text input
     */
    static sanitizeText(input: string, options?: SanitizationOptions): string;
    /**
     * Sanitize input for database use
     */
    static sanitizeForDatabase(input: string): string;
    /**
     * Sanitize file names
     */
    static sanitizeFileName(fileName: string): string;
    /**
     * Sanitize URLs
     */
    static sanitizeUrl(url: string): string;
    /**
     * Sanitize email addresses
     */
    static sanitizeEmail(email: string): string;
    /**
     * Sanitize phone numbers
     */
    static sanitizePhoneNumber(phone: string): string;
    /**
     * Validate and sanitize JSON
     */
    static sanitizeJSON(input: string): any;
    /**
     * Recursively sanitize object properties
     */
    static sanitizeObject(obj: any): any;
    /**
     * Escape HTML characters
     */
    private static escapeHtml;
    /**
     * Generate CSRF token
     */
    static generateCSRFToken(): string;
    /**
     * Validate CSRF token
     */
    static validateCSRFToken(token: string): boolean;
    /**
     * Create secure form data
     */
    static createSecureFormData(data: Record<string, any>): FormData;
    /**
     * Sanitize query parameters
     */
    static sanitizeQueryParams(params: Record<string, string>): Record<string, string>;
    /**
     * Secure local storage
     */
    static setSecureItem(key: string, value: any): void;
    static getSecureItem<T>(key: string): T | null;
    static removeSecureItem(key: string): void;
    /**
     * Content Security Policy utilities
     */
    static applyCSP(): void;
    /**
     * Secure random string generation
     */
    static generateSecureRandom(length?: number): string;
    /**
     * Password strength validation
     */
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number;
        feedback: string[];
    };
}
export declare function useSecureInput(initialValue?: string, options?: SanitizationOptions): {
    value: string;
    setValue: import("react").Dispatch<import("react").SetStateAction<string>>;
    handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    reset: () => void;
};
export declare function withInputSanitization<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P>;
