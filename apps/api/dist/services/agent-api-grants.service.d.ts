import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@the-new-fuse/database';
import { CreateAgentGrantDto } from '../dto/agent-grants.dto';
type RoutingSelection = {
    provider: string;
    model: string;
};
export declare class AgentApiGrantsService {
    private readonly db;
    private readonly jwtService;
    private readonly configService;
    constructor(db: DatabaseService, jwtService: JwtService, configService: ConfigService);
    listForUser(userId: string): Promise<{
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
    createForUser(userId: string, dto: CreateAgentGrantDto): Promise<{
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
    revokeForUser(userId: string, grantId: string): Promise<{
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
    rotateForUser(userId: string, grantId: string): Promise<{
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
    proxy(provider: string, bearerToken: string | undefined, body: any): Promise<any>;
    adaptiveProxy(target: string, bearerToken: string | undefined, body: any): Promise<any>;
    getAdaptiveConfig(target: string): Promise<{
        target: string;
        primary: RoutingSelection;
        fallback: RoutingSelection;
    }>;
    private executeProxyForGrant;
    private validateGrantFromToken;
    private findActiveGrantForAgentProvider;
    private resolveAdaptiveRouting;
    private normalizeSelection;
    private mintGrantToken;
    private verifyGrantToken;
    private buildOutboundPayload;
    private normalizeGoogleADKMessages;
    private getProviderEndpoint;
    private buildProviderHeaders;
    private extractUsage;
    private estimateCostCents;
    private tryParseJson;
    private resolveGoogleADKBaseUrl;
}
export {};
//# sourceMappingURL=agent-api-grants.service.d.ts.map