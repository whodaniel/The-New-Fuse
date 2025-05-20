import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { CircuitBreaker } from '../resilience/CircuitBreaker.js';
import { MetricsProcessor } from '../security/metricsProcessor.js';

const logger: Logger = getLogger('agent_communication');

export interface AgentMessage {
    id: string;
    type: 'task_request' | 'task_response' | 'status_update' | 'error';
    timestamp: number;
    sender: string;
    recipient: string;
    payload: unknown;
    metadata: {
        priority: 'low' | 'medium' | 'high';
        timeout?: number;
        retryCount?: number;
    };
}

export class AgentCommunicationBridge {
    private readonly circuitBreaker: CircuitBreaker;
    private readonly metricsProcessor: MetricsProcessor;
    private readonly messageHandlers: Map<string, (message: AgentMessage) => Promise<void>>;

    constructor(metricsProcessor: MetricsProcessor) {
        this.circuitBreaker = new CircuitBreaker({
            failureThreshold: 3,
            resetTimeout: 30000,
            halfOpenRequests: 2
        });
        this.metricsProcessor = metricsProcessor;
        this.messageHandlers = new Map();
    }

    async sendMessage(message: AgentMessage): Promise<void> {
        return this.circuitBreaker.execute(async () => {
            try {
                logger.debug(`Sending message to ${message.recipient}`, { messageId: message.id });

                await this.validateMessage(message);
                const enrichedMessage = await this.enrichMessage(message);

                await this.publishMessage(enrichedMessage);

                await this.metricsProcessor.processAgentMetrics({
                    type: 'message_sent',
                    agentId: message.sender,
                    timestamp: Date.now(),
                    success: true
                });
            } catch (error) {
                logger.error('Failed to send message:', error);
                // Handle message error
                logger.error(`Message error for ${message.id}:`, error);
                throw error;
            }
        });
    }

    async registerHandler(
        agentId: string,
        handler: (message: AgentMessage) => Promise<void>
    ): Promise<void> {
        this.messageHandlers.set(agentId, handler);
        logger.info(`Registered message handler for agent ${agentId}`);
    }

    private async validateMessage(message: AgentMessage): Promise<void> {
        if (!message.id || !message.sender || !message.recipient) {
            throw new Error('Invalid message format: missing required fields');
        }

        if (!this.messageHandlers.has(message.recipient)) {
            throw new Error(`No handler registered for recipient ${message.recipient}`);
        }
    }

    private async enrichMessage(message: AgentMessage): Promise<AgentMessage> {
        return {
            ...message,
            metadata: {
                ...message.metadata,
                // Add additional metadata without changing the type
                retryCount: (message.metadata.retryCount || 0) + 1
            }
        };
    }

    private async publishMessage(message: AgentMessage): Promise<void> {
        const handler = this.messageHandlers.get(message.recipient);
        if (handler) {
            await handler(message);
        }
    }

    private generateCorrelationId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
}