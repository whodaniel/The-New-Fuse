/**
 * Webhook Gateway Controller
 * Unified endpoint for webhook and SSE operations
 */
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';
export declare class WebhookGatewayController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    registerWebhook(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    handleWebhook(source: string, body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getWebhookStatus(id: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getEventHistory(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    streamEvents(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=webhook-gateway.controller.d.ts.map