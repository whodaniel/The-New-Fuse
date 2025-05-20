import { LoggingService } from '../services/logging.js';
import { ProgressTracker } from '../services/progress_tracker.js';
export class ConnectionManager {
    constructor() {
        this.bridge = CascadeBridge.getInstance();
        this.logger = LoggingService.getInstance();
        this.progressTracker = ProgressTracker.getInstance();
    }
    async connectAndSend(message, options = {}) {
        const { maxRetries = 3, retryDelay = 1000, timeout = 5000 } = options;
        const taskId = this.progressTracker.startTask('connection', {
            messageType: message.type,
            retries: 0,
            maxRetries
        });
        let retries = 0;
        while (retries < maxRetries) {
            try {
                if (!this.bridge.isConnected()) {
                    this.logger.info('Attempting to establish connection', { retry: retries + 1 });
                    this.progressTracker.updateProgress(taskId, ((retries + 1) / maxRetries) * 50, 'Connecting...');
                    await this.waitForConnection(timeout);
                }
                this.progressTracker.updateProgress(taskId, 75, 'Sending message...');
                await this.bridge.send(message);
                this.progressTracker.completeTask(taskId, 'Message sent successfully');
                this.logger.info('Message sent successfully', { messageType: message.type });
                return;
            }
            catch (error) {
                retries++;
                this.logger.warn('Connection attempt failed', {
                    retry: retries,
                    maxRetries,
                    error: error
                });
                if (retries < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
                else {
                    this.progressTracker.failTask(taskId, 'Failed to send message after max retries');
                    this.logger.error('Max retries reached', error);
                    throw new Error('Failed to send message after max retries');
                }
            }
        }
    }
    waitForConnection(timeout) {
        return new Promise((resolve, reject) => {
            if (this.bridge.isConnected()) {
                resolve();
                return;
            }
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('Connection timeout'));
            }, timeout);
            const handleConnect = (): any => {
                cleanup();
                resolve();
            };
            const handleError = (error): any => {
                cleanup();
                reject(error);
            };
            const cleanup = (): any => {
                clearTimeout(timeoutId);
                this.bridge.removeListener('connected', handleConnect);
                this.bridge.removeListener('error', handleError);
            };
            this.bridge.once('connected', handleConnect);
            this.bridge.once('error', handleError);
        });
    }
}
//# sourceMappingURL=connect_and_send.js.map