var DateFormatter = /** @class */ (function () {
    function DateFormatter() {
    }
    DateFormatter.formatDate = function (date, format) {
        if (format === void 0) { format = 'yyyy-MM-dd'; }
        var d = new Date(date);
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var hours = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        var seconds = String(d.getSeconds()).padStart(2, '0');
        return format
            .replace('yyyy', String(year))
            .replace('MM', month)
            .replace('dd', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    };
    DateFormatter.formatRelative = function (date) {
        var now = new Date();
        var d = new Date(date);
        var diff = now.getTime() - d.getTime();
        var seconds = Math.floor(diff / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        if (seconds < 60) {
            return 'just now';
        }
        else if (minutes < 60) {
            return "".concat(minutes, "m ago");
        }
        else if (hours < 24) {
            return "".concat(hours, "h ago");
        }
        else if (days < 7) {
            return "".concat(days, "d ago");
        }
        else {
            return this.formatDate(date);
        }
    };
    return DateFormatter;
}());
export { DateFormatter };
var NumberFormatter = /** @class */ (function () {
    function NumberFormatter() {
    }
    NumberFormatter.formatNumber = function (number, options) {
        if (options === void 0) { options = {}; }
        return new Intl.NumberFormat(undefined, options).format(number);
    };
    NumberFormatter.formatCurrency = function (amount, currency, locale) {
        if (currency === void 0) { currency = 'USD'; }
        if (locale === void 0) { locale = 'en-US'; }
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    };
    NumberFormatter.formatPercentage = function (number, decimals, includeSign) {
        if (decimals === void 0) { decimals = 2; }
        if (includeSign === void 0) { includeSign = true; }
        var formatted = (number * 100).toFixed(decimals);
        return includeSign ? "".concat(formatted, "%") : formatted;
    };
    NumberFormatter.formatFileSize = function (bytes) {
        var units = ['B', 'KB', 'MB', 'GB', 'TB'];
        var size = bytes;
        var unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return "".concat(size.toFixed(1), " ").concat(units[unitIndex]);
    };
    return NumberFormatter;
}());
export { NumberFormatter };
var StringFormatter = /** @class */ (function () {
    function StringFormatter() {
    }
    StringFormatter.capitalize = function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };
    StringFormatter.truncate = function (str, length, suffix) {
        if (suffix === void 0) { suffix = '...'; }
        if (str.length <= length)
            return str;
        return str.substring(0, length - suffix.length) + suffix;
    };
    StringFormatter.slugify = function (str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };
    StringFormatter.camelToSnakeCase = function (str) {
        return str.replace(/[A-Z]/g, function (letter) { return "_".concat(letter.toLowerCase()); });
    };
    StringFormatter.snakeToCamelCase = function (str) {
        return str.replace(/_([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
    };
    StringFormatter.formatPhoneNumber = function (phoneNumber, format) {
        if (format === void 0) { format = '(xxx) xxx-xxxx'; }
        var digits = phoneNumber.replace(/\D/g, '');
        var result = format;
        var index = 0;
        return result.replace(/x/g, function () { return digits[index++] || ''; });
    };
    return StringFormatter;
}());
export { StringFormatter };
var DurationFormatter = /** @class */ (function () {
    function DurationFormatter() {
    }
    DurationFormatter.formatDuration = function (milliseconds) {
        var seconds = Math.floor(milliseconds / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        if (days > 0) {
            return "".concat(days, "d ").concat(hours % 24, "h");
        }
        else if (hours > 0) {
            return "".concat(hours, "h ").concat(minutes % 60, "m");
        }
        else if (minutes > 0) {
            return "".concat(minutes, "m ").concat(seconds % 60, "s");
        }
        else {
            return "".concat(seconds, "s");
        }
    };
    DurationFormatter.formatTimeRange = function (start, end) {
        var startDate = new Date(start);
        var endDate = new Date(end);
        var duration = endDate.getTime() - startDate.getTime();
        return this.formatDuration(duration);
    };
    return DurationFormatter;
}());
export { DurationFormatter };
