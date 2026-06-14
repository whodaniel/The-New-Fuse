/**
 * Simple logger utility for consistent logging across the application
 */
export class Logger {
    constructor(context) {
        this.context = context;
    }
    info(message, ...optionalParams) {
        console.info(`[${this.timestamp}] [${this.context}] [INFO] ${message}`, ...optionalParams);
    }
    debug(message, ...optionalParams) {
        console.debug(`[${this.timestamp}] [${this.context}] [DEBUG] ${message}`, ...optionalParams);
    }
    warn(message, ...optionalParams) {
        console.warn(`[${this.timestamp}] [${this.context}] [WARN] ${message}`, ...optionalParams);
    }
    error(message, ...optionalParams) {
        console.error(`[${this.timestamp}] [${this.context}] [ERROR] ${message}`, ...optionalParams);
    }
    get timestamp() {
        return new Date().toISOString();
    }
}
//# sourceMappingURL=logger.js.map