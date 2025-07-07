"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LoggingService = void 0;
/**
 * Temporary stub for LoggingService until core package is built
 */
class LoggingService {
    log(message) {
        console.log(message);
    }
    error(message) {
        console.error(message);
    }
    warn(message) {
        console.warn(message);
    }
    info(message) {
        console.info(message);
    }
}
exports.LoggingService = LoggingService;
exports.Logger = LoggingService;
