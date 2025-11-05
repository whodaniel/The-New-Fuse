import { ProxyService } from '../proxy/proxy.service';
export declare class A2AGatewayController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    health(): {
        status: string;
        service: string;
        timestamp: string;
    };
    proxyAll(path: string, headers: Record<string, string>, query: Record<string, string>, body: any): Promise<any>;
}
//# sourceMappingURL=a2a-gateway.controller.d.ts.map