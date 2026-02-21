import { Injectable } from '@nestjs/common';
import { A2AMessageQueue } from './A2AMessageQueue.js';
import { ConfigurationManager } from '../config/A2AConfig.js';

@Injectable()
export class A2AErrorHandler {
    constructor(
        private messageQueue: A2AMessageQueue,
        private config: ConfigurationManager
    ) {}

    async handleMessageFailure(error: any, message: any, context: any): Promise<void> {
        const retryAttempt = (context.retryCount || 0) + 1;
        const maxRetries = this.config.getConfig().retryAttempts;

        if (retryAttempt <= maxRetries) {
            await this.scheduleRetry(message, {
                ...context,
                retryCount: retryAttempt,
                error: error.message
            });
        } else {
            await this.handleFatalError(error, message, context);
        }
    }

    private async scheduleRetry(message: any, context: any): Promise<void> {
        const delay = Math.min(1000 * Math.pow(2, context.retryCount), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.messageQueue.enqueueMessage(message.metadata.sender, {
            ...message,
            metadata: {
                ...message.metadata,
                retryContext: context
            }
        });
    }

    private async handleFatalError(error: any, message: any, context: any): Promise<void> {
        // Implementation for fatal error handling
    }
}