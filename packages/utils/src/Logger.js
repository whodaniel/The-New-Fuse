/**
 * Lightweight logger utility for the application
 */
export class Logger {
    context;
    enableTimestamp;
    constructor(context, enableTimestamp = true) {
        this.context = context;
        this.enableTimestamp = enableTimestamp;
    }
    getPrefix() {
        const timestamp = this.enableTimestamp ? `[${new Date().toISOString()}] ` : '';
        return `${timestamp}[${this.context}] `;
    }
    log(message, ...optionalParams) {
        console.log(this.getPrefix() + message, ...optionalParams);
    }
    error(message, ...optionalParams) {
        console.error(this.getPrefix() + message, ...optionalParams);
    }
    warn(message, ...optionalParams) {
        console.warn(this.getPrefix() + message, ...optionalParams);
    }
    debug(message, ...optionalParams) {
        console.debug(this.getPrefix() + message, ...optionalParams);
    }
    verbose(message, ...optionalParams) {
        console.info(this.getPrefix() + message, ...optionalParams);
    }
    setContext(context) {
        this.context = context;
    }
}
//# sourceMappingURL=Logger.js.map