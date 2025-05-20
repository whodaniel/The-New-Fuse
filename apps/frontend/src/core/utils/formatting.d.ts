export declare class DateFormatter {
    static formatDate(date: Date | string | number, format?: string): string;
    static formatRelative(date: Date | string | number): string;
}
export declare class NumberFormatter {
    static formatNumber(number: number, options?: Intl.NumberFormatOptions): string;
    static formatCurrency(amount: number, currency?: string, locale?: string): string;
    static formatPercentage(number: number, decimals?: number, includeSign?: boolean): string;
    static formatFileSize(bytes: number): string;
}
export declare class StringFormatter {
    static capitalize(str: string): string;
    static truncate(str: string, length: number, suffix?: string): string;
    static slugify(str: string): string;
    static camelToSnakeCase(str: string): string;
    static snakeToCamelCase(str: string): string;
    static formatPhoneNumber(phoneNumber: string, format?: string): string;
}
export declare class DurationFormatter {
    static formatDuration(milliseconds: number): string;
    static formatTimeRange(start: Date | string | number, end: Date | string | number): string;
}
