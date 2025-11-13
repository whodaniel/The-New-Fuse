import { WebhookBridge, WebhookBridgeConfig, WebhookConfiguration } from '../types/integration-bridge-types';
export declare class WebhookBridgeImplementation implements WebhookBridge {
    private readonly config;
    constructor(config: WebhookBridgeConfig);
    createWebhook(config: Omit<WebhookConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfiguration>;
}
//# sourceMappingURL=WebhookBridge.d.ts.map