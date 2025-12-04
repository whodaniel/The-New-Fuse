/**
 * TimeStamp utility class for handling timestamp formatting and comparisons.
 * Used primarily in chat components for displaying message timestamps.
 */
var TimeStamp = /** @class */ (function () {
    /**
     * Creates a new TimeStamp instance
     * @param value A Date object, timestamp number, or date string
     */
    function TimeStamp(value) {
        if (value === void 0) { value = Date.now(); }
        this.timestamp = new Date(value);
        // Handle invalid dates
        if (isNaN(this.timestamp.getTime())) {
            this.timestamp = new Date();
        }
    }
    /**
     * Returns the raw Date object
     */
    TimeStamp.prototype.getDate = function () {
        return this.timestamp;
    };
    /**
     * Returns timestamp in milliseconds since epoch
     */
    TimeStamp.prototype.getTime = function () {
        return this.timestamp.getTime();
    };
    /**
     * Creates a TimeStamp from the current date and time
     */
    TimeStamp.now = function () {
        return new TimeStamp(Date.now());
    };
    /**
     * Creates a TimeStamp from an ISO string
     */
    TimeStamp.fromISOString = function (isoString) {
        return new TimeStamp(new Date(isoString));
    };
    /**
     * Formats the timestamp according to the provided options
     */
    TimeStamp.prototype.format = function (options) {
        if (options === void 0) { options = {}; }
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
        return new Intl.DateTimeFormat('en-US', formatOptions).format(this.timestamp);
    };
    /**
     * Returns just the time portion of the timestamp
     */
    TimeStamp.prototype.formatTime = function () {
        return this.timestamp.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    /**
     * Returns the date and time together
     */
    TimeStamp.prototype.formatDateTime = function () {
        return "".concat(this.format({ includeTime: false }), " at ").concat(this.formatTime());
    };
    /**
     * Returns a relative time string (e.g., "5m ago", "yesterday")
     */
    TimeStamp.prototype.formatRelative = function () {
        var now = new Date();
        var diffInSeconds = Math.floor((now.getTime() - this.timestamp.getTime()) / 1000);
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
        if (this.isYesterday()) {
            return 'yesterday';
        }
        var diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return "".concat(diffInDays, "d ago");
        }
        return this.format({ format: 'short' });
    };
    /**
     * Returns a human-readable time ago string (e.g., "5 minutes ago", "yesterday")
     */
    TimeStamp.prototype.formatTimeAgo = function () {
        var now = new Date();
        var seconds = Math.floor((now.getTime() - this.timestamp.getTime()) / 1000);
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
    };
    /**
     * Formats a duration in milliseconds to a human-readable string
     */
    TimeStamp.formatDuration = function (milliseconds) {
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
    };
    /**
     * Returns the duration between this timestamp and another
     */
    TimeStamp.prototype.durationTo = function (other) {
        var otherDate = other instanceof TimeStamp ? other.getDate() : new Date(other);
        var duration = Math.abs(this.timestamp.getTime() - otherDate.getTime());
        return TimeStamp.formatDuration(duration);
    };
    /**
     * Checks if this timestamp is on the same day as another
     */
    TimeStamp.prototype.isSameDay = function (other) {
        var otherDate = other instanceof TimeStamp ? other.getDate() : new Date(other);
        return (this.timestamp.getFullYear() === otherDate.getFullYear() &&
            this.timestamp.getMonth() === otherDate.getMonth() &&
            this.timestamp.getDate() === otherDate.getDate());
    };
    /**
     * Checks if this timestamp is today
     */
    TimeStamp.prototype.isToday = function () {
        var today = new Date();
        return (this.timestamp.getDate() === today.getDate() &&
            this.timestamp.getMonth() === today.getMonth() &&
            this.timestamp.getFullYear() === today.getFullYear());
    };
    /**
     * Checks if this timestamp is yesterday
     */
    TimeStamp.prototype.isYesterday = function () {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return (this.timestamp.getDate() === yesterday.getDate() &&
            this.timestamp.getMonth() === yesterday.getMonth() &&
            this.timestamp.getFullYear() === yesterday.getFullYear());
    };
    /**
     * Returns a new TimeStamp set to the start of the day (00:00:00)
     */
    TimeStamp.prototype.startOfDay = function () {
        var result = new Date(this.timestamp);
        result.setHours(0, 0, 0, 0);
        return new TimeStamp(result);
    };
    /**
     * Returns a new TimeStamp set to the end of the day (23:59:59.999)
     */
    TimeStamp.prototype.endOfDay = function () {
        var result = new Date(this.timestamp);
        result.setHours(23, 59, 59, 999);
        return new TimeStamp(result);
    };
    /**
     * Returns a new TimeStamp with the specified number of days added
     */
    TimeStamp.prototype.addDays = function (days) {
        var result = new Date(this.timestamp);
        result.setDate(result.getDate() + days);
        return new TimeStamp(result);
    };
    /**
     * Returns a new TimeStamp with the specified number of days subtracted
     */
    TimeStamp.prototype.subtractDays = function (days) {
        return this.addDays(-days);
    };
    /**
     * Returns a new TimeStamp with the specified number of hours added
     */
    TimeStamp.prototype.addHours = function (hours) {
        var result = new Date(this.timestamp);
        result.setHours(result.getHours() + hours);
        return new TimeStamp(result);
    };
    /**
     * Returns a new TimeStamp with the specified number of minutes added
     */
    TimeStamp.prototype.addMinutes = function (minutes) {
        var result = new Date(this.timestamp);
        result.setMinutes(result.getMinutes() + minutes);
        return new TimeStamp(result);
    };
    /**
     * Converts the timestamp to ISO string format
     */
    TimeStamp.prototype.toISOString = function () {
        return this.timestamp.toISOString();
    };
    /**
     * Parses a string into a TimeStamp, returns null if invalid
     */
    TimeStamp.parse = function (dateString) {
        var date = new Date(dateString);
        return isNaN(date.getTime()) ? null : new TimeStamp(date);
    };
    return TimeStamp;
}());
export { TimeStamp };
