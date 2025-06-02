"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = exports.FileUploadError = exports.BaseError = void 0;
// BaseError Class
class BaseError extends Error {
    code; // Default code, can be overridden by specific error classes
    statusCode;
    details;
    timestamp;
    constructor(message, statusCode, code, details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code || 'UNSPECIFIED_ERROR'; // Default error code
        this.details = details;
        this.timestamp = new Date();
        Object.setPrototypeOf(this, new.target.prototype); // Ensure instanceof works
    }
}
exports.BaseError = BaseError;
// FileUploadError Class
class FileUploadError extends BaseError {
    fileName;
    reason;
    constructor(message = 'File upload failed', statusCode = 500, fileName, reason, code, details) {
        super(message, statusCode, code || 'FILE_UPLOAD_ERROR', details);
        this.fileName = fileName;
        this.reason = reason;
    }
}
exports.FileUploadError = FileUploadError;
// AuthenticationError Class (to replace AuthError)
class AuthenticationError extends BaseError {
    userId;
    action;
    constructor(message = 'Authentication failed', statusCode = 401, userId, action, code, details) {
        super(message, statusCode, code || 'AUTHENTICATION_ERROR', details);
        this.userId = userId;
        this.action = action;
    }
}
exports.AuthenticationError = AuthenticationError;
//# sourceMappingURL=error.js.map