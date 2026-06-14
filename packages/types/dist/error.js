export class CustomError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'CustomError';
        this.context = {
            timestamp: new Date(),
            source: context.source || 'unknown',
            severity: context.severity || 'medium',
            metadata: context.metadata || {}
        };
    }
}
//# sourceMappingURL=error.js.map