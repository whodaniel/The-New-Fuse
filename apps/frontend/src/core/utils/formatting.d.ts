export declare class DateFormatter {
    static formatDate(date: any, format?: string): string;
    static formatRelative(date: any): string;
}
export declare class NumberFormatter {
    static formatNumber(number: any, options?: {}): string;
    static formatCurrency(amount: any, currency?: string, locale?: string): string;
    static formatPercentage(number: any, decimals?: number, includeSign?: boolean): string;
    static formatFileSize(bytes: any): string;
}
export declare class StringFormatter {
    static capitalize(str: any): any;
    static truncate(str: any, length: any, suffix?: string): any;
    static slugify(str: any): any;
    static camelToSnakeCase(str: any): any;
    static snakeToCamelCase(str: any): any;
    static formatPhoneNumber(phoneNumber: any, format?: string): string;
}
export declare class DurationFormatter {
    static formatDuration(milliseconds: any): string;
    static formatTimeRange(start: any, end: any): string;
}
