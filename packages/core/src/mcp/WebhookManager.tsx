import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { MCPRegistry } from './MCPRegistry.js';
import { MCPTool } from './types.js';

interface WebhookConfig {
    url: string;
    events: string[];
    secret?: string;
    headers?: Record<string, string>;
    retryConfig?: {
        maxAttempts: number;
        backoffMs: number;
    };
}

interface WebhookEvent {
    id: string;
    type: string;
    timestamp: number;
    payload: any;
}

@Injectable()
export class WebhookManager {
    private webhooks: Map<string, WebhookConfig[]> = new Map();
    private logger: Logger;
    private registry: MCPRegistry;

    constructor() {
        this.logger = new Logger('WebhookManager');
        this.registry = MCPRegistry.getInstance();
    }

    /**
     * Register a new webhook for MCP events
     */
    registerWebhook(toolName: string, config: WebhookConfig): string {
        const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (!this.webhooks.has(toolName)) {
            this.webhooks.set(toolName, []);
        }
        
        this.webhooks.get(toolName)?.push({
            ...config,
            retryConfig: config.retryConfig || {
                maxAttempts: 3,
                backoffMs: 1000
            }
        });

        this.logger.log(`Registered webhook ${webhookId} for tool ${toolName}`);
        return webhookId;
    }

    /**
     * Convert a tool into a webhook-enabled tool
     */
    wrapToolWithWebhook(tool: MCPTool): MCPTool {
        const originalExecute = tool.execute;

        return {
            ...tool,
            execute: async (params: any) => {
                try {
                    // Execute original tool
                    const result = await originalExecute(params);

                    // Trigger webhooks
                    await this.triggerWebhooks(tool.name, 'success', {
                        params,
                        result,
                        timestamp: Date.now()
                    });

                    return result;
                } catch (error) {
                    // Trigger error webhooks
                    await this.triggerWebhooks(tool.name, 'error', {
                        params,
                        error: error.message,
                        timestamp: Date.now()
                    });
                    
                    throw error;
                }
            }
        };
    }

    /**
     * Trigger registered webhooks for a tool event
     */
    private async triggerWebhooks(
        toolName: string,
        eventType: string,
        payload: any
    ): Promise<void> {
        const webhooks = this.webhooks.get(toolName) || [];
        const event: WebhookEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            timestamp: Date.now(),
            payload
        };

        for (const webhook of webhooks) {
            if (webhook.events.includes(eventType) || webhook.events.includes('*')) {
                await this.sendWebhookWithRetry(webhook, event);
            }
        }
    }

    /**
     * Send webhook with retry logic
     */
    private async sendWebhookWithRetry(
        webhook: WebhookConfig,
        event: WebhookEvent,
        attempt: number = 1
    ): Promise<void> {
        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': this.generateSignature(event, webhook.secret),
                    ...webhook.headers
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }

            this.logger.debug(`Successfully delivered webhook ${event.id}`);
        } catch (error) {
            if (
                webhook.retryConfig &&
                attempt < webhook.retryConfig.maxAttempts
            ) {
                const backoffTime = webhook.retryConfig.backoffMs * Math.pow(2, attempt - 1);
                this.logger.warn(
                    `Webhook delivery failed, retrying in ${backoffTime}ms. ` +
                    `Attempt ${attempt} of ${webhook.retryConfig.maxAttempts}`
                );
                
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                return this.sendWebhookWithRetry(webhook, event, attempt + 1);
            }
            
            this.logger.error(
                `Webhook delivery failed after ${attempt} attempts: ${error.message}`
            );
        }
    }

    /**
     * Generate signature for webhook payload
     */
    private generateSignature(event: WebhookEvent, secret?: string): string {
        if (!secret) return '';
        
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(event));
        return hmac.digest('hex');
    }

    /**
     * List all registered webhooks for a tool
     */
    getWebhooks(toolName: string): WebhookConfig[] {
        return this.webhooks.get(toolName) || [];
    }

    /**
     * Remove a webhook registration
     */
    removeWebhook(toolName: string, webhookId: string): boolean {
        const webhooks = this.webhooks.get(toolName);
        if (!webhooks) return false;

        const index = webhooks.findIndex(w => w.url === webhookId);
        if (index === -1) return false;

        webhooks.splice(index, 1);
        if (webhooks.length === 0) {
            this.webhooks.delete(toolName);
        }

        this.logger.log(`Removed webhook ${webhookId} from tool ${toolName}`);
        return true;
    }
}