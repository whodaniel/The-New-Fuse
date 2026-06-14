import { CreateAgentGrantDto } from '../dto/agent-grants.dto';
import { AgentApiGrantsService } from '../services/agent-api-grants.service';
export declare class AgentGrantsController {
    private readonly grantsService;
    constructor(grantsService: AgentApiGrantsService);
    list(user: {
        id: string;
    }): Promise<{
        id: string;
        userId: string;
        agentId: string;
        provider: string;
        allowedModels: string[];
        maxRequestsPerMinute: number;
        dailyTokenBudget: number;
        monthlyUsdCap: number;
        expiresAt: Date;
        revoked: boolean;
        tokenVersion: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(user: {
        id: string;
    }, dto: CreateAgentGrantDto): Promise<{
        grant: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            agentId: string;
            expiresAt: Date;
            provider: string;
            allowedModels: string[];
            maxRequestsPerMinute: number;
            dailyTokenBudget: number;
            monthlyUsdCap: number;
            revoked: boolean;
            tokenVersion: number;
        };
        accessToken: string;
    }>;
    revoke(user: {
        id: string;
    }, id: string): Promise<{
        id: string;
        userId: string;
        agentId: string;
        provider: string;
        allowedModels: string[];
        maxRequestsPerMinute: number;
        dailyTokenBudget: number;
        monthlyUsdCap: number;
        expiresAt: Date;
        revoked: boolean;
        tokenVersion: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    rotate(user: {
        id: string;
    }, id: string): Promise<{
        grant: {
            id: string;
            userId: string;
            agentId: string;
            provider: string;
            allowedModels: string[];
            maxRequestsPerMinute: number;
            dailyTokenBudget: number;
            monthlyUsdCap: number;
            expiresAt: Date;
            revoked: boolean;
            tokenVersion: number;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
    }>;
}
//# sourceMappingURL=agent-grants.controller.d.ts.map