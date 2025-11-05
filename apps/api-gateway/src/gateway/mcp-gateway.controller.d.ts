/**
 * MCP Gateway Controller
 * Unified endpoint for Model Context Protocol operations
 */
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';
export declare class McpGatewayController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    getMcpServers(headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    registerMcpServer(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getMcpServerStatus(id: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    updateMcpServer(id: string, body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    removeMcpServer(id: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getMcpOAuthDiscovery(headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=mcp-gateway.controller.d.ts.map