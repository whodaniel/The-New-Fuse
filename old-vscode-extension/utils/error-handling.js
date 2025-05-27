"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseError = void 0;
exports.isErrorWithMessage = isErrorWithMessage;
exports.toErrorWithMessage = toErrorWithMessage;
exports.getErrorMessage = getErrorMessage;
function isErrorWithMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
function toErrorWithMessage(maybeError) {
    if (isErrorWithMessage(maybeError))
        return maybeError;
    try {
        return new Error(JSON.stringify(maybeError));
    }
    catch {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references for example
        return new Error(String(maybeError));
    }
}
function getErrorMessage(error) {
    return toErrorWithMessage(error).message;
}
class BaseError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = new.target.name;
    }
}
exports.BaseError = BaseError;
//# sourceMappingURL=error-handling.js.map