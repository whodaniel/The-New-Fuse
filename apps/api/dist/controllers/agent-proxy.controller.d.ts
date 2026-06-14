import { AgentApiGrantsService } from '../services/agent-api-grants.service';
export declare class AgentProxyController {
    private readonly grantsService;
    constructor(grantsService: AgentApiGrantsService);
    proxy(provider: string, authorization: string | undefined, body: any): Promise<any>;
    adaptiveProxy(target: string, authorization: string | undefined, body: any): Promise<any>;
    adaptiveConfig(target: string): Promise<{
        target: string;
        primary: {
            provider: string;
            model: string;
        };
        fallback: {
            provider: string;
            model: string;
        };
    }>;
}
//# sourceMappingURL=agent-proxy.controller.d.ts.map