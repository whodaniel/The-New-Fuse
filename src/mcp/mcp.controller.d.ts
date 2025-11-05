import { MCPService } from './mcp.service';
export declare class MCPController {
    private readonly mcpService;
    constructor(mcpService: MCPService);
    getHealth(): Promise<{
        status: string;
        service: string;
        version: string;
        mcp_protocol_version: string;
        uptime: number;
        timestamp: string;
    }>;
    getInfo(): Promise<{
        service: {
            name: string;
            description: string;
            version: string;
            mcp_protocol_version: string;
        };
        capabilities: string[];
    }>;
    getDiscovery(): Promise<{
        service: string;
        version: string;
        mcp_protocol_version: string;
        description: string;
        capabilities: {
            configuration_management: {
                list_servers: boolean;
                validate_configuration: boolean;
                backup_restore: boolean;
                template_management: boolean;
            };
            monitoring: {
                health_checks: boolean;
                server_discovery: boolean;
                configuration_validation: boolean;
            };
        };
    }>;
    listServers(query: any): Promise<{
        servers: never[];
        total: number;
        timestamp: string;
    }>;
    addServer(serverData: any): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    removeServer(name: string, options: any): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    validateConfiguration(config: any): Promise<{
        valid: boolean;
        errors: never[];
        warnings: never[];
        timestamp: string;
    }>;
}
//# sourceMappingURL=mcp.controller.d.ts.map