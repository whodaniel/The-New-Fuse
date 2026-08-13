/**
 * User-Friendly Error Messages
 *
 * @description
 * Provides human-readable error messages and translations
 * for better user experience when errors occur.
 */
import { ApplicationError } from '../errors/CustomErrors.js';
/**
 * Error message templates
 */
export interface ErrorMessageTemplate {
    title: string;
    message: string;
    suggestion?: string;
    technicalDetails?: string;
}
/**
 * Supported languages
 */
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
/**
 * Error message formatter
 */
export declare class ErrorMessageFormatter {
    private currentLanguage;
    /**
     * Set the current language
     */
    setLanguage(language: Language): void;
    /**
     * Get the current language
     */
    getLanguage(): Language;
    /**
     * Get user-friendly error message
     */
    format(error: ApplicationError | Error | number, language?: Language): ErrorMessageTemplate;
    /**
     * Get message by error code
     */
    private getMessageByCode;
    /**
     * Get title only
     */
    getTitle(error: ApplicationError | Error | number, language?: Language): string;
    /**
     * Get message only
     */
    getMessage(error: ApplicationError | Error | number, language?: Language): string;
    /**
     * Get suggestion only
     */
    getSuggestion(error: ApplicationError | Error | number, language?: Language): string | undefined;
    /**
     * Add custom error message
     */
    addCustomMessage(code: number, messages: Record<Language, ErrorMessageTemplate>): void;
}
/**
 * Global error message formatter instance
 */
export declare const errorMessageFormatter: ErrorMessageFormatter;
/**
 * Convenience function to get user-friendly error message
 */
export declare function getUserFriendlyMessage(error: ApplicationError | Error | number, language?: Language): ErrorMessageTemplate;
//# sourceMappingURL=ErrorMessages.d.ts.map