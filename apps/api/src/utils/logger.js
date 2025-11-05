// Local Logger implementation
export class Logger {
    static log(message, context) {
        console.log(`[${context || 'App'}] ${message}`);
    }
    static error(message, trace, context) {
        console.error(`[${context || 'App'}] ${message}`);
        if (trace)
            console.error(trace);
    }
    static warn(message, context) {
        console.warn(`[${context || 'App'}] ${message}`);
    }
    static debug(message, context) {
        console.debug(`[${context || 'App'}] ${message}`);
    }
    static verbose(message, context) {
        console.log(`[VERBOSE][${context || 'App'}] ${message}`);
    }
}
export class LoggingService {
    context;
    constructor(context) {
        this.context = context;
    }
    log(message) {
        Logger.log(message, this.context);
    }
    error(message, trace) {
        Logger.error(message, trace, this.context);
    }
    warn(message) {
        Logger.warn(message, this.context);
    }
    debug(message) {
        Logger.debug(message, this.context);
    }
}
//# sourceMappingURL=logger.js.map