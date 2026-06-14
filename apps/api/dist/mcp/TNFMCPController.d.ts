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
        port?: undefined;
    }>;
    getHealth(): Promise<{
        status: string;
        details: any;
        timestamp: string;
    }>;
    getMarketplaceServers(): Promise<({
        id: string;
        name: string;
        description: string;
        version: string;
        publisher: string;
        category: string;
        rating: number;
        downloads: number;
        lastUpdated: string;
        installCommand: string;
        args: string[];
        capabilities: string[];
        requiresConfiguration: boolean;
        configurationSchema?: undefined;
    } | {
        id: string;
        name: string;
        description: string;
        version: string;
        publisher: string;
        category: string;
        rating: number;
        downloads: number;
        lastUpdated: string;
        installCommand: string;
        args: string[];
        capabilities: string[];
        requiresConfiguration: boolean;
        configurationSchema: {
            type: string;
            required: string[];
            properties: {
                allowedDirectories: {
                    type: string;
                    description: string;
                };
            };
        };
    })[]>;
    installServer(body: {
        serverId: string;
        configuration: any;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=TNFMCPController.d.ts.map