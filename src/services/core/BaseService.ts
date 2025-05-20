import { Logger } from '@the-new-fuse/utils';
import { EventEmitter } from '../../utils/EventEmitter.js';

export abstract class BaseService extends EventEmitter {
    protected readonly logger: Logger;
    protected initialized = false;

    constructor(serviceName: string) {
        super();
        this.logger = new Logger(serviceName);
    }

    /**
     * Initialize the service (once)
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }
        try {
            await this.doInitialize();
            this.initialized = true;
        } catch (error) {
            this.logger.error('Initialization failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    protected abstract doInitialize(): Promise<void>;
}