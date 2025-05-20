import { StateManager } from '../../domain/core/stateManager.js';
import { LoggingService } from '../../services/logging.js';
export class ErrorService {
    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 100;
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupGlobalErrorHandling();
    }
    static getInstance() {
        if (!ErrorService.instance) {
            ErrorService.instance = new ErrorService();
        }
        return ErrorService.instance;
    }
    setupGlobalErrorHandling() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(message), {
                source,
                line: lineno,
                column: colno
            });
        };
        window.onunhandledrejection = (event) => {
            this.handleError(event.reason, {
                type: 'unhandled_promise_rejection'
            });
        };
    }
    handleError(error, context) {
        const errorReport = {
            code: error.name,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now(),
            handled: true
        };
        this.addToHistory(errorReport);
        this.logger.error(error.message, error);
        this.eventBus.emit('error_occurred', errorReport, 'ErrorService');
        if (this.shouldReportError(errorReport)) {
            this.reportError(errorReport);
        }
    }
    shouldReportError(error) {
        return true;
    }
    async reportError(error) {
        try {
            await fetch('/api/errors/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(error)
            });
        }
        catch (reportError) {
            this.logger.error('Failed to report error', reportError);
        }
    }
    addToHistory(error) {
        this.errorHistory.push(error);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
        this.stateManager.setState(['errors', 'history'], this.errorHistory);
    }
    getErrorHistory() {
        return [...this.errorHistory];
    }
    clearHistory() {
        this.errorHistory.length = 0;
        this.stateManager.setState(['errors', 'history'], []);
    }
    async getErrorStats() {
        try {
            const stats = {
                total: this.errorHistory.length,
                handled: this.errorHistory.filter(e => e.handled).length,
                unhandled: this.errorHistory.filter(e => !e.handled).length,
                byType: this.errorHistory.reduce((acc, error) => {
                    acc[error.code] = (acc[error.code] || 0) + 1;
                    return acc;
                }, {})
            };
            return { success: true, data: stats };
        }
        catch (error) {
            this.logger.error('Failed to get error stats', error);
            return {
                success: false,
                error: {
                    code: 'ERROR_STATS_FAILED',
                    message: 'Failed to get error statistics',
                    details: error
                }
            };
        }
    }
    subscribeToErrors(callback) {
        return this.eventBus.on('error_occurred', (event) => callback(event.payload));
    }
    subscribeToErrorHistory(callback) {
        return this.stateManager.subscribe(['errors', 'history'], callback);
    }
}
//# sourceMappingURL=ErrorService.js.map