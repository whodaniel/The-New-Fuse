/**
 * Temporary stub for LoggingService until core package is built
 */
export class LoggingService {
    log(message: string) {
        console.log(message);
    }
    
    error(message: string) {
        console.error(message);
    }
    
    warn(message: string) {
        console.warn(message);
    }
    
    info(message: string) {
        console.info(message);
    }
}

export { LoggingService as Logger };
