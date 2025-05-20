
export {}
exports.RetryError = exports.APIError = exports.AIbitatError = void 0;
class AIbitatError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AIbitatError';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AIbitatError);
        }
    }
}
exports.AIbitatError = AIbitatError;
class APIError extends AIbitatError {
    constructor(message) {
        super(message);
        this.name = 'APIError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, APIError);
        }
    }
}
exports.APIError = APIError;
/**
 * The error when the AI provider returns an error that should be treated as something
 * that should be retried.
 */
class RetryError extends APIError {
    constructor(message) {
        super(message);
        this.name = 'RetryError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RetryError);
        }
    }
}
exports.RetryError = RetryError;
//# sourceMappingURL=error.js.mapexport {};
