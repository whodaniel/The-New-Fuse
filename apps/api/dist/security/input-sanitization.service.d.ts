import { ConfigService } from '@nestjs/config';
export declare class InputSanitizationService {
    private configService;
    private window;
    private domPurify;
    constructor(configService: ConfigService);
    /**
     * Sanitize HTML content to prevent XSS attacks
     */
    sanitizeHTML(html: string): string;
    /**
     * Sanitize plain text input
     */
    sanitizeText(input: string): string;
    /**
     * Sanitize for database insertion (SQL injection prevention)
     */
    sanitizeForDatabase(input: string): string;
    /**
     * Sanitize file names
     */
    sanitizeFileName(fileName: string): string;
    /**
     * Sanitize URLs
     */
    sanitizeUrl(url: string): string;
    /**
     * Sanitize email addresses
     */
    sanitizeEmail(email: string): string;
    /**
     * Sanitize phone numbers
     */
    sanitizePhoneNumber(phone: string): string;
    /**
     * Sanitize JSON input
     */
    sanitizeJSON(input: string): any;
    /**
     * Recursively sanitize object properties
     */
    sanitizeObject(obj: any): any;
    /**
     * Sanitize search queries
     */
    sanitizeSearchQuery(query: string): string;
    /**
     * Validate and sanitize color values
     */
    sanitizeColor(color: string): string;
    /**
     * Sanitize IP addresses
     */
    sanitizeIPAddress(ip: string): string;
}
//# sourceMappingURL=input-sanitization.service.d.ts.map