import { HttpService } from '@nestjs/axios';
import { Agent, UpdateAgentDto, MCPTool } from '@the-new-fuse/types';
type JsonValue = string | number | boolean | null | {
    [key: string]: JsonValue;
} | JsonValue[];
export declare class MCPRegistryService {
    private readonly httpService;
    private readonly logger;
    private readonly backendApiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService);
    private getAuthHeaders;
    getTools(): MCPTool[];
    private registerAgentTool;
    registerAgent(params: {
        name: string;
        type: string;
        metadata?: Record<string, any>;
    }): Promise<Agent>;
    private updateAgentProfileTool;
    updateAgentProfile(agentId: string, updates: UpdateAgentDto): Promise<Agent>;
    private registerEntityTool;
    registerEntity(params: {
        name: string;
        type: string;
        metadata?: JsonValue;
    }, : any, : any, url: any, { this: , backendApiUrl }: {
        this: any;
        backendApiUrl: any;
    }): any;
}
export {};
//# sourceMappingURL=mcp-registry.service.d.ts.map