"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ApplicationError = void 0;
var __decorate = (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3
            ? target
            : desc === null
                ? (desc = Object.getOwnPropertyDescriptor(target, key))
                : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
var __metadata = (this && this.__metadata) ||
    function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(k, v);
    };
var __param = (this && this.__param) ||
    function (paramIndex, decorator) {
        return function (target, key) {
            decorator(target, key, paramIndex);
        };
    };
var _a;
import inversify_1 from 'inversify';
import types_1 from '../di/types.js';
import metrics_collector_1 from '../metrics/metrics-collector.js';
class ApplicationError extends Error {
    constructor(message, code, statusCode = 500, details) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: code,
        });
        Object.defineProperty(this, "statusCode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: statusCode,
        });
        Object.defineProperty(this, "details", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: details,
        });
        this.name = "ApplicationError";
    }
}
exports.ApplicationError = ApplicationError;
let ErrorHandler = class ErrorHandler {
    constructor(logger, metrics) {
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: logger,
        });
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: metrics,
        });
    }
    handleError(error, metadata = {}) {
        const errorDetails = this.extractErrorDetails(error);
        // Log the error
        this.logger.error("An error occurred", Object.assign(Object.assign({}, errorDetails), metadata));
        // Track metrics
        this.metrics.incrementCounter("error_total", {
            type: error.name,
            code: error.code || "UNKNOWN",
        });
        // Additional error handling logic can be added here
        // For example: sending to error tracking service, alerting, etc.
    }
    createError(message, code, statusCode = 500, details) {
        return new ApplicationError(message, code, statusCode, details);
    }
    extractErrorDetails(error) {
        const details = {
            message: error.message,
            name: error.name,
            stack: error.stack,
        };
        if (error instanceof ApplicationError) {
            details.code = error.code;
            details.statusCode = error.statusCode;
            details.details = error.details;
        }
        return details;
    }
    isApplicationError(error) {
        return error instanceof ApplicationError;
    }
    wrapError(error, message, code = "INTERNAL_ERROR", statusCode = 500) {
        return new ApplicationError(`${message}: ${error.message}`, code, statusCode, { originalError: error });
    }
};
exports.ErrorHandler = ErrorHandler;
exports.ErrorHandler = ErrorHandler = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.Logger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.MetricsCollector)),
    __metadata("design:paramtypes", [
        typeof (_a = typeof winston_1.Logger !== "undefined" && winston_1.Logger) === "function"
            ? _a
            : Object,
        metrics_collector_1.MetricsCollector,
    ]),
], ErrorHandler);
//# sourceMappingURL=error-handler.js.map
