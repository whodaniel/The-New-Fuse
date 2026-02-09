export interface DateFormatOptions {
  includeTime?: boolean;
  includeSeconds?: boolean;
  includeDate?: boolean;
  format?: 'short' | 'medium' | 'long';
}

export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const dateObj = new Date(date);
  
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

  return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
}

export function formatTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return `${formatDate(d)} at ${formatTime(d)}`;
}

export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

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

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return formatDate(d);
}

export function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(date: Date | string | number): boolean {
  const dateObj = new Date(date);
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(date: Date | string | number): boolean {
  const dateObj = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
}

export function getStartOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date | string | number, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function subtractDays(date: Date | string | number, days: number): Date {
  return addDays(date, -days);
}

export function getRelativeTime(date: Date | string | number): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

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

  if (isYesterday(dateObj)) {
    return 'yesterday';
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return formatDate(dateObj, { format: 'short' });
}

export function startOfDay(date: Date | string | number): Date {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

export function endOfDay(date: Date | string | number): Date {
  const dateObj = new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDuration(milliseconds: number): string {
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

export function timeAgo(date: Date | string | number): string {
  const dateObj = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
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