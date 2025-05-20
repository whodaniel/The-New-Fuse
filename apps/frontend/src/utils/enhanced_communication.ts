import { Logger } from './logger.js';
const logger = new Logger('EnhancedCommunicationBus');
export class EnhancedCommunicationBus extends EventEmitter {
    constructor(options = {}) {
        var _a, _b, _c;
        super();
        this.options = {
            retryAttempts: (_a = options.retryAttempts) !== null && _a !== void 0 ? _a : 3,
            retryDelay: (_b = options.retryDelay) !== null && _b !== void 0 ? _b : 1000,
            timeout: (_c = options.timeout) !== null && _c !== void 0 ? _c : 5000
        };
        this.activePublications = new Map();
    }
    async publish(topic, message, options = {}) {
        var _a, _b;
        const publication = {
            id: this.generateId(),
            topic,
            message,
            timestamp: new Date().toISOString(),
            priority: (_a = options.priority) !== null && _a !== void 0 ? _a : 'normal',
            metadata: options.metadata
        };
        const timeoutId = setTimeout(() => {
            this.handlePublicationTimeout(publication.id);
        }, (_b = options.expiration) !== null && _b !== void 0 ? _b : this.options.timeout);
        this.activePublications.set(publication.id, timeoutId);
        try {
            await this.attemptPublish(publication, this.options.retryAttempts);
            this.activePublications.delete(publication.id);
            clearTimeout(timeoutId);
            this.emit('published', publication);
            logger.debug('Publication successful', { publicationId: publication.id });
        }
        catch (error) {
            this.activePublications.delete(publication.id);
            clearTimeout(timeoutId);
            const errorDetails = {
                publication,
                error: error instanceof Error ? error.message : String(error)
            };
            this.emit('error', errorDetails);
            logger.error('Publication failed', errorDetails);
            throw error;
        }
    }
    async attemptPublish(publication, remainingAttempts) {
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.emit('published', publication);
            logger.debug('Publish attempt successful', {
                publicationId: publication.id,
                remainingAttempts
            });
        }
        catch (error) {
            logger.warn('Publish attempt failed', {
                publicationId: publication.id,
                remainingAttempts,
                error: error instanceof Error ? error.message : String(error)
            });
            if (remainingAttempts > 0) {
                await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
                return this.attemptPublish(publication, remainingAttempts - 1);
            }
            throw error;
        }
    }
    handlePublicationTimeout(publicationId) {
        const timeoutId = this.activePublications.get(publicationId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activePublications.delete(publicationId);
            this.emit('timeout', { publicationId });
            logger.warn('Publication timeout', { publicationId });
        }
    }
    generateId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        return `${timestamp}_${randomStr}`;
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    off(event, listener) {
        return super.off(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
}
//# sourceMappingURL=enhanced_communication.js.map