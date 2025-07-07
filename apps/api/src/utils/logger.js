"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class ConsoleLogger {
    log(message, ...args) {
        console.log(`[LOG] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[ERROR] ${message}`, ...args);
    }
    warn(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    }
    debug(message, ...args) {
        console.debug(`[DEBUG] ${message}`, ...args);
    }
    info(message, ...args) {
        console.info(`[INFO] ${message}`, ...args);
    }
}
exports.logger = new ConsoleLogger();
exports.default = exports.logger;
