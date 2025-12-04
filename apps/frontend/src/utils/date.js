export function formatDate(date, options) {
    if (options === void 0) { options = {}; }
    var dateObj = new Date(date);
    var _a = options.includeTime, includeTime = _a === void 0 ? true : _a, _b = options.includeSeconds, includeSeconds = _b === void 0 ? false : _b, _c = options.includeDate, includeDate = _c === void 0 ? true : _c, _d = options.format, format = _d === void 0 ? 'medium' : _d;
    var formatOptions = {
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
export function formatTime(date) {
    var d = new Date(date);
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
}
export function formatDateTime(date) {
    var d = new Date(date);
    return "".concat(formatDate(d), " at ").concat(formatTime(d));
}
export function formatRelativeTime(date) {
    var now = new Date();
    var d = new Date(date);
    var diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return 'just now';
    }
    var diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return "".concat(diffInMinutes, "m ago");
    }
    var diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return "".concat(diffInHours, "h ago");
    }
    var diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return "".concat(diffInDays, "d ago");
    }
    return formatDate(d);
}
export function isSameDay(date1, date2) {
    var d1 = new Date(date1);
    var d2 = new Date(date2);
    return (d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate());
}
export function isToday(date) {
    var dateObj = new Date(date);
    var today = new Date();
    return (dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear());
}
export function isYesterday(date) {
    var dateObj = new Date(date);
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (dateObj.getDate() === yesterday.getDate() &&
        dateObj.getMonth() === yesterday.getMonth() &&
        dateObj.getFullYear() === yesterday.getFullYear());
}
export function getStartOfDay(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
export function getEndOfDay(date) {
    var d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
export function addDays(date, days) {
    var d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
export function subtractDays(date, days) {
    return addDays(date, -days);
}
export function getRelativeTime(date) {
    var dateObj = new Date(date);
    var now = new Date();
    var diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return 'just now';
    }
    var diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return "".concat(diffInMinutes, "m ago");
    }
    var diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return "".concat(diffInHours, "h ago");
    }
    if (isYesterday(dateObj)) {
        return 'yesterday';
    }
    var diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return "".concat(diffInDays, "d ago");
    }
    return formatDate(dateObj, { format: 'short' });
}
export function startOfDay(date) {
    var dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
}
export function endOfDay(date) {
    var dateObj = new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
}
export function parseDate(dateString) {
    var date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}
export function formatDuration(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    if (days > 0) {
        return "".concat(days, "d ").concat(hours % 24, "h");
    }
    if (hours > 0) {
        return "".concat(hours, "h ").concat(minutes % 60, "m");
    }
    if (minutes > 0) {
        return "".concat(minutes, "m ").concat(seconds % 60, "s");
    }
    return "".concat(seconds, "s");
}
export function timeAgo(date) {
    var dateObj = new Date(date);
    var now = new Date();
    var seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    var months = Math.floor(days / 30);
    var years = Math.floor(months / 12);
    if (years > 0)
        return years === 1 ? 'a year ago' : "".concat(years, " years ago");
    if (months > 0)
        return months === 1 ? 'a month ago' : "".concat(months, " months ago");
    if (days > 0)
        return days === 1 ? 'yesterday' : "".concat(days, " days ago");
    if (hours > 0)
        return hours === 1 ? 'an hour ago' : "".concat(hours, " hours ago");
    if (minutes > 0)
        return minutes === 1 ? 'a minute ago' : "".concat(minutes, " minutes ago");
    return 'just now';
}
