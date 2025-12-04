export interface DateFormatOptions {
    includeTime?: boolean;
    includeSeconds?: boolean;
    includeDate?: boolean;
    format?: 'short' | 'medium' | 'long';
}
export declare function formatDate(date: Date | string | number, options?: DateFormatOptions): string;
export declare function formatTime(date: Date | string | number): string;
export declare function formatDateTime(date: Date | string | number): string;
export declare function formatRelativeTime(date: Date | string | number): string;
export declare function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean;
export declare function isToday(date: Date | string | number): boolean;
export declare function isYesterday(date: Date | string | number): boolean;
export declare function getStartOfDay(date: Date | string | number): Date;
export declare function getEndOfDay(date: Date | string | number): Date;
export declare function addDays(date: Date | string | number, days: number): Date;
export declare function subtractDays(date: Date | string | number, days: number): Date;
export declare function getRelativeTime(date: Date | string | number): string;
export declare function startOfDay(date: Date | string | number): Date;
export declare function endOfDay(date: Date | string | number): Date;
export declare function parseDate(dateString: string): Date | null;
export declare function formatDuration(milliseconds: number): string;
export declare function timeAgo(date: Date | string | number): string;
