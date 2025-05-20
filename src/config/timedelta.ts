export class TimeSpan {
  private milliseconds: number;

  constructor(milliseconds: number) {
    this.milliseconds = milliseconds;
  }

  static fromMilliseconds(value: number): TimeSpan {
    return new TimeSpan(value);
  }

  static fromSeconds(value: number): TimeSpan {
    return new TimeSpan(value * 1000);
  }

  static fromMinutes(value: number): TimeSpan {
    return new TimeSpan(value * 60 * 1000);
  }

  static fromHours(value: number): TimeSpan {
    return new TimeSpan(value * 60 * 60 * 1000);
  }

  static fromDays(value: number): TimeSpan {
    return new TimeSpan(value * 24 * 60 * 60 * 1000);
  }

  getMilliseconds(): number {
    return this.milliseconds;
  }

  getSeconds(): number {
    return this.milliseconds / 1000;
  }

  getMinutes(): number {
    return this.milliseconds / (60 * 1000);
  }

  getHours(): number {
    return this.milliseconds / (60 * 60 * 1000);
  }

  getDays(): number {
    return this.milliseconds / (24 * 60 * 60 * 1000);
  }

  add(other: TimeSpan): TimeSpan {
    return new TimeSpan(this.milliseconds + other.milliseconds);
  }

  subtract(other: TimeSpan): TimeSpan {
    return new TimeSpan(this.milliseconds - other.milliseconds);
  }
}

// Constants for time unit conversions
const MINUTE = 60;
const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Format seconds into a human-readable string
 */
export function formatTimeSpan(seconds: number): string {
  if (seconds < MINUTE) return `${seconds}s`;
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h`;
  if (seconds < WEEK) return `${Math.floor(seconds / DAY)}d`;
  return `${Math.floor(seconds / WEEK)}w`;
}
