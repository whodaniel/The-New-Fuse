import { Injectable } from '@nestjs/common';
import { ErrorHandler, ErrorContext } from '../types.js';
import { A2AMessage } from '../../protocols/types.js';

@Injectable()
export class A2AErrorHandler implements ErrorHandler {
    async handleError(error: any, context: ErrorContext) {
        if (error.protocol === 'A2A') {
            const errorMessage: A2AMessage = {
                type: 'ERROR',
                payload: {
                    error: error.message,
                    nodeId: context.nodeId,
                    workflowId: context.workflowId
                },
                metadata: {
                    timestamp: Date.now(),
                    sender: context.nodeId,
                    protocol_version: '1.0'
                }
            };
            
            await context.notifyError(errorMessage);
            return {
                handled: true,
                recovery: {
                    type: 'retry',
                    maxAttempts: 3
                }
            };
        }
        
        return { handled: false };
    }
}