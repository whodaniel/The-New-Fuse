export class DateFormatter {
    static formatDate(date, format = 'yyyy-MM-dd') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return format
            .replace('yyyy', String(year))
            .replace('MM', month)
            .replace('dd', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }
    static formatRelative(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = now.getTime() - d.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (seconds < 60) {
            return 'just now';
        }
        else if (minutes < 60) {
            return `${minutes}m ago`;
        }
        else if (hours < 24) {
            return `${hours}h ago`;
        }
        else if (days < 7) {
            return `${days}d ago`;
        }
        else {
            return this.formatDate(date);
        }
    }
}
export class NumberFormatter {
    static formatNumber(number, options = {}) {
        return new Intl.NumberFormat(undefined, options).format(number);
    }
    static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency
        }).format(amount);
    }
    static formatPercentage(number, decimals = 2, includeSign = true) {
        const formatted = (number * 100).toFixed(decimals);
        return includeSign ? `${formatted}%` : formatted;
    }
    static formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
}
export class StringFormatter {
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    static truncate(str, length, suffix = '...') {
        if (str.length <= length)
            return str;
        return str.substring(0, length - suffix.length) + suffix;
    }
    static slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    static camelToSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    static snakeToCamelCase(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    static formatPhoneNumber(phoneNumber, format = '(xxx) xxx-xxxx') {
        const digits = phoneNumber.replace(/\D/g, '');
        let result = format;
        let index = 0;
        return result.replace(/x/g, () => digits[index++] || '');
    }
}
export class DurationFormatter {
    static formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        }
        else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
    static formatTimeRange(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const duration = endDate.getTime() - startDate.getTime();
        return this.formatDuration(duration);
    }
}
//# sourceMappingURL=formatting.js.map