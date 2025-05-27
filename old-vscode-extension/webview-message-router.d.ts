import { RelayService } from './relay-service.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';
interface WebViewMessage {
    type: string;
    text: string;
    metadata?: Record<string, any>;
}
export declare class WebViewMessageRouter {
    private readonly relayService;
    private readonly llmManager;
    constructor(relayService: RelayService, llmManager: LLMProviderManager);
    handleMessage(message: WebViewMessage): Promise<void>;
    private handleLLMRequest;
}
export {};
//# sourceMappingURL=webview-message-router.d.ts.map