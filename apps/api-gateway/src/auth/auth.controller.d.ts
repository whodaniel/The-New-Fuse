/**
 * Authentication Controller
 * Proxies authentication requests to backend services
 */
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';
export declare class AuthController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    login(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    register(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    refresh(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=auth.controller.d.ts.map