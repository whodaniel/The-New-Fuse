import { MCPService } from '../services/mcp.service';
interface ExecuteDirectiveDto {
    serverName: string;
    action: string;
    params?: Record<string, any>;
    metadata?: Record<string, any>;
}
export declare class MCPController {
    private readonly mcpService;
    constructor(mcpService: MCPService);
    registerServer(dto: {
        name: string;
        server: any;
    }): Promise<{
        success: boolean;
        message: string;
        error?: never;
    } | {
        success: boolean;
        error: any;
        message?: never;
    }>;
    getServers(): Promise<{
        success: boolean;
        data: any;
    }>;
    getServerStatus(): Promise<{
        success: boolean;
        data: any;
    }>;
    getCapabilities(): {
        success: boolean;
        data: any;
    };
    getTools(): {
        success: boolean;
        data: any;
    };
    executeDirective(dto: ExecuteDirectiveDto, req: any): Promise<{
        success: boolean;
        data: any;
        error?: never;
    } | {
        success: boolean;
        error: any;
        data?: never;
    }>;
}
export {};
//# sourceMappingURL=mcp.controller.d.ts.map