const vscode = require('vscode');

/**
 * Centralized Logging Service using VSCode OutputChannel
 * Replaces console.log for better IDE integration
 */
class LoggingService {
    constructor(channelName = 'The New Fuse') {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
        this.logLevel = 'info'; // debug, info, warn, error
        this.timestamp = true;
    }

    /**
     * Get formatted timestamp
     */
    _getTimestamp() {
        if (!this.timestamp) return '';
        const now = new Date();
        return `[${now.toISOString()}] `;
    }

    /**
     * Format log message with level and emoji
     */
    _formatMessage(level, ...args) {
        const emoji = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            success: '✅',
            security: '🔐'
        };

        const levelEmoji = emoji[level] || '';
        const timestamp = this._getTimestamp();
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        return `${timestamp}${levelEmoji} [${level.toUpperCase()}] ${message}`;
    }

    /**
     * Check if message should be logged based on log level
     */
    _shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.logLevel];
    }

    /**
     * Log debug message
     */
    debug(...args) {
        if (this._shouldLog('debug')) {
            this.outputChannel.appendLine(this._formatMessage('debug', ...args));
        }
    }

    /**
     * Log info message
     */
    info(...args) {
        if (this._shouldLog('info')) {
            this.outputChannel.appendLine(this._formatMessage('info', ...args));
        }
    }

    /**
     * Log warning message
     */
    warn(...args) {
        if (this._shouldLog('warn')) {
            this.outputChannel.appendLine(this._formatMessage('warn', ...args));
            // Also show console warning for development
            if (process.env.NODE_ENV === 'development') {
                console.warn(...args);
            }
        }
    }

    /**
     * Log error message
     */
    error(...args) {
        if (this._shouldLog('error')) {
            this.outputChannel.appendLine(this._formatMessage('error', ...args));
            // Always show console error
            console.error(...args);
        }
    }

    /**
     * Log success message
     */
    success(...args) {
        if (this._shouldLog('info')) {
            this.outputChannel.appendLine(this._formatMessage('success', ...args));
        }
    }

    /**
     * Log security-related message
     */
    security(...args) {
        if (this._shouldLog('info')) {
            this.outputChannel.appendLine(this._formatMessage('security', ...args));
        }
    }

    /**
     * Show output channel to user
     */
    show() {
        this.outputChannel.show();
    }

    /**
     * Hide output channel
     */
    hide() {
        this.outputChannel.hide();
    }

    /**
     * Clear output channel
     */
    clear() {
        this.outputChannel.clear();
    }

    /**
     * Set log level
     */
    setLogLevel(level) {
        if (['debug', 'info', 'warn', 'error'].includes(level)) {
            this.logLevel = level;
            this.info(`Log level set to: ${level}`);
        }
    }

    /**
     * Enable/disable timestamps
     */
    setTimestamp(enabled) {
        this.timestamp = enabled;
    }

    /**
     * Dispose of output channel
     */
    dispose() {
        this.outputChannel.dispose();
    }

    /**
     * Create logger instance (singleton pattern)
     */
    static instance = null;

    static getInstance(channelName) {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService(channelName);
        }
        return LoggingService.instance;
    }
}

module.exports = LoggingService;