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

export class TimeStamp {
  private timestamp: Date;

  /**
   * Creates a new TimeStamp instance
   * @param value A Date object, timestamp number, or date string
   */
  constructor(value: Date | string | number = Date.now()) {
    this.timestamp = new Date(value);
    
    // Handle invalid dates
    if (isNaN(this.timestamp.getTime())) {
      this.timestamp = new Date();
    }
  }

  /**
   * Returns the raw Date object
   */
  getDate(): Date {
    return this.timestamp;
  }

  /**
   * Returns timestamp in milliseconds since epoch
   */
  getTime(): number {
    return this.timestamp.getTime();
  }

  /**
   * Creates a TimeStamp from the current date and time
   */
  static now(): TimeStamp {
    return new TimeStamp(Date.now());
  }

  /**
   * Creates a TimeStamp from an ISO string
   */
  static fromISOString(isoString: string): TimeStamp {
    return new TimeStamp(new Date(isoString));
  }

  /**
   * Formats the timestamp according to the provided options
   */
  format(options: TimeStampFormatOptions = {}): string {
    const {
      includeTime = true,
      includeSeconds = false,
      includeDate = true,
      format = 'medium'
    } = options;

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? '2-digit' : format === 'long' ? 'long' : 'short',
      day: '2-digit',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
      second: includeTime && includeSeconds ? '2-digit' : undefined,
      hour12: true
    };

    if (!includeDate) {
      delete formatOptions.year;
      delete formatOptions.month;
      delete formatOptions.day;
    }

    return new Intl.DateTimeFormat('en-US', formatOptions).format(this.timestamp);
  }

  /**
   * Returns just the time portion of the timestamp
   */
  formatTime(): string {
    return this.timestamp.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Returns the date and time together
   */
  formatDateTime(): string {
    return `${this.format({ includeTime: false })} at ${this.formatTime()}`;
  }

  /**
   * Returns a relative time string (e.g., "5m ago", "yesterday")
   */
  formatRelative(): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - this.timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    if (this.isYesterday()) {
      return 'yesterday';
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return this.format({ format: 'short' });
  }

  /**
   * Returns a human-readable time ago string (e.g., "5 minutes ago", "yesterday")
   */
  formatTimeAgo(): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - this.timestamp.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return years === 1 ? 'a year ago' : `${years} years ago`;
    if (months > 0) return months === 1 ? 'a month ago' : `${months} months ago`;
    if (days > 0) return days === 1 ? 'yesterday' : `${days} days ago`;
    if (hours > 0) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
    if (minutes > 0) return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
    return 'just now';
  }

  /**
   * Formats a duration in milliseconds to a human-readable string
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Returns the duration between this timestamp and another
   */
  durationTo(other: TimeStamp | Date | string | number): string {
    const otherDate = other instanceof TimeStamp ? other.getDate() : new Date(other);
    const duration = Math.abs(this.timestamp.getTime() - otherDate.getTime());
    return TimeStamp.formatDuration(duration);
  }

  /**
   * Checks if this timestamp is on the same day as another
   */
  isSameDay(other: TimeStamp | Date | string | number): boolean {
    const otherDate = other instanceof TimeStamp ? other.getDate() : new Date(other);
    return (
      this.timestamp.getFullYear() === otherDate.getFullYear() &&
      this.timestamp.getMonth() === otherDate.getMonth() &&
      this.timestamp.getDate() === otherDate.getDate()
    );
  }

  /**
   * Checks if this timestamp is today
   */
  isToday(): boolean {
    const today = new Date();
    return (
      this.timestamp.getDate() === today.getDate() &&
      this.timestamp.getMonth() === today.getMonth() &&
      this.timestamp.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Checks if this timestamp is yesterday
   */
  isYesterday(): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      this.timestamp.getDate() === yesterday.getDate() &&
      this.timestamp.getMonth() === yesterday.getMonth() &&
      this.timestamp.getFullYear() === yesterday.getFullYear()
    );
  }

  /**
   * Returns a new TimeStamp set to the start of the day (00:00:00)
   */
  startOfDay(): TimeStamp {
    const result = new Date(this.timestamp);
    result.setHours(0, 0, 0, 0);
    return new TimeStamp(result);
  }

  /**
   * Returns a new TimeStamp set to the end of the day (23:59:59.999)
   */
  endOfDay(): TimeStamp {
    const result = new Date(this.timestamp);
    result.setHours(23, 59, 59, 999);
    return new TimeStamp(result);
  }

  /**
   * Returns a new TimeStamp with the specified number of days added
   */
  addDays(days: number): TimeStamp {
    const result = new Date(this.timestamp);
    result.setDate(result.getDate() + days);
    return new TimeStamp(result);
  }

  /**
   * Returns a new TimeStamp with the specified number of days subtracted
   */
  subtractDays(days: number): TimeStamp {
    return this.addDays(-days);
  }

  /**
   * Returns a new TimeStamp with the specified number of hours added
   */
  addHours(hours: number): TimeStamp {
    const result = new Date(this.timestamp);
    result.setHours(result.getHours() + hours);
    return new TimeStamp(result);
  }

  /**
   * Returns a new TimeStamp with the specified number of minutes added
   */
  addMinutes(minutes: number): TimeStamp {
    const result = new Date(this.timestamp);
    result.setMinutes(result.getMinutes() + minutes);
    return new TimeStamp(result);
  }

  /**
   * Converts the timestamp to ISO string format
   */
  toISOString(): string {
    return this.timestamp.toISOString();
  }

  /**
   * Parses a string into a TimeStamp, returns null if invalid
   */
  static parse(dateString: string): TimeStamp | null {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : new TimeStamp(date);
  }
}