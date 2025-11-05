import { TNFMCPService } from './TNFMCPService';
export declare class TNFMCPController {
    private readonly mcpService;
    private readonly logger;
    constructor(mcpService: TNFMCPService);
    getStatus(): Promise<any>;
    startRemoteServer(body: {
        port?: number;
    }): Promise<{
        success: boolean;
        message: string;
        port: number;
    } | {
        success: boolean;
        message: string;
        port?: never;
    }>;
    getHealth(): Promise<{
        status: string;
        details: any;
        timestamp: string;
    }>;
}
//# sourceMappingURL=TNFMCPController.d.ts.map