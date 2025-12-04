/**
 * TimeStamp utility class for handling timestamp formatting and comparisons.
 * Used primarily in chat components for displaying message timestamps.
 */
export interface TimeStampFormatOptions {
    includeTime?: boolean;
    includeSeconds?: boolean;
    includeDate?: boolean;
    format?: 'short' | 'medium' | 'long';
}
export declare class TimeStamp {
    private timestamp;
    /**
     * Creates a new TimeStamp instance
     * @param value A Date object, timestamp number, or date string
     */
    constructor(value?: Date | string | number);
    /**
     * Returns the raw Date object
     */
    getDate(): Date;
    /**
     * Returns timestamp in milliseconds since epoch
     */
    getTime(): number;
    /**
     * Creates a TimeStamp from the current date and time
     */
    static now(): TimeStamp;
    /**
     * Creates a TimeStamp from an ISO string
     */
    static fromISOString(isoString: string): TimeStamp;
    /**
     * Formats the timestamp according to the provided options
     */
    format(options?: TimeStampFormatOptions): string;
    /**
     * Returns just the time portion of the timestamp
     */
    formatTime(): string;
    /**
     * Returns the date and time together
     */
    formatDateTime(): string;
    /**
     * Returns a relative time string (e.g., "5m ago", "yesterday")
     */
    formatRelative(): string;
    /**
     * Returns a human-readable time ago string (e.g., "5 minutes ago", "yesterday")
     */
    formatTimeAgo(): string;
    /**
     * Formats a duration in milliseconds to a human-readable string
     */
    static formatDuration(milliseconds: number): string;
    /**
     * Returns the duration between this timestamp and another
     */
    durationTo(other: TimeStamp | Date | string | number): string;
    /**
     * Checks if this timestamp is on the same day as another
     */
    isSameDay(other: TimeStamp | Date | string | number): boolean;
    /**
     * Checks if this timestamp is today
     */
    isToday(): boolean;
    /**
     * Checks if this timestamp is yesterday
     */
    isYesterday(): boolean;
    /**
     * Returns a new TimeStamp set to the start of the day (00:00:00)
     */
    startOfDay(): TimeStamp;
    /**
     * Returns a new TimeStamp set to the end of the day (23:59:59.999)
     */
    endOfDay(): TimeStamp;
    /**
     * Returns a new TimeStamp with the specified number of days added
     */
    addDays(days: number): TimeStamp;
    /**
     * Returns a new TimeStamp with the specified number of days subtracted
     */
    subtractDays(days: number): TimeStamp;
    /**
     * Returns a new TimeStamp with the specified number of hours added
     */
    addHours(hours: number): TimeStamp;
    /**
     * Returns a new TimeStamp with the specified number of minutes added
     */
    addMinutes(minutes: number): TimeStamp;
    /**
     * Converts the timestamp to ISO string format
     */
    toISOString(): string;
    /**
     * Parses a string into a TimeStamp, returns null if invalid
     */
    static parse(dateString: string): TimeStamp | null;
}
