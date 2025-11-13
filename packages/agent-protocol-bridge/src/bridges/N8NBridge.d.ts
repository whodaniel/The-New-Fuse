import { N8NBridge, N8NBridgeConfig } from '../types/integration-bridge-types';
export declare class N8NBridgeImplementation implements N8NBridge {
    private readonly config;
    private readonly n8nApiUrl;
    constructor(config: N8NBridgeConfig);
    registerWebhook(workflowId: string, path: string): Promise<string>;
}
//# sourceMappingURL=N8NBridge.d.ts.map