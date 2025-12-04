interface HighlightOptions {
    language?: string;
    ignoreIllegals?: boolean;
}
export declare function highlightCode(code: string, options?: HighlightOptions): string;
export declare function detectLanguage(code: string, filename?: string): string;
export declare function getLanguageIcon(language: string): string;
export declare function registerCustomLanguages(): void;
export {};
