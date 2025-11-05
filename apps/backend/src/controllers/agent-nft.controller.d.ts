import { AgentNftService, MintAgentNftDto, FractionalizeAgentDto, CreateRevenueStreamDto, DistributeRevenueDto } from '../services/agent-nft.service';
export declare class AgentNftController {
    private readonly agentNftService;
    constructor(agentNftService: AgentNftService);
    mintAgentAsNft(agentId: string, body: Omit<MintAgentNftDto, 'agentId'>): Promise<{
        id: string;
        agentId: string;
        tokenId: string;
        isFractionalized: boolean;
        totalShares: number | null;
        smartAccountAddress: string | null;
    }>;
    fractionalizeAgent(agentId: string, body: Omit<FractionalizeAgentDto, 'agentNftId'>): Promise<{
        id: string;
        agentId: string;
        tokenId: string;
        isFractionalized: boolean;
        totalShares: number | null;
        smartAccountAddress: string | null;
    }>;
    createRevenueStream(agentId: string, body: Omit<CreateRevenueStreamDto, 'agentNftId'>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        totalRevenue: string;
        streamName: string;
        agentNftId: string;
        revenueToken: string;
        distributedRevenue: string;
        distributionThreshold: string;
    }>;
    distributeRevenue(streamId: string, body: Omit<DistributeRevenueDto, 'revenueStreamId'>): Promise<{
        message: string;
    }>;
    getAgentNft(agentId: string): Promise<{
        id: string;
        agentId: string;
        tokenId: string;
        isFractionalized: boolean;
        totalShares: number | null;
        smartAccountAddress: string | null;
    } | {
        message: string;
        nft: null;
    }>;
    getAgentNftByTokenId(tokenId: string): Promise<{
        id: string;
        agentId: string;
        tokenId: string;
        isFractionalized: boolean;
        totalShares: number | null;
        smartAccountAddress: string | null;
    } | {
        message: string;
        nft: null;
    }>;
    getUserFractionalShares(ownerAddress: string): Promise<{
        id: string;
        agentNftId: string;
        ownerAddress: string;
        shareAmount: number;
    }[]>;
    getActiveMarketplaceListings(): Promise<{
        id: string;
        status: string;
        agentNftId: string;
        shareAmount: number;
        pricePerShare: string;
        totalPrice: string;
        seller: string;
    }[]>;
    updateAgentMetadata(agentId: string, metadataUri: string): Promise<{
        id: string;
        agentId: string;
        tokenId: string;
        isFractionalized: boolean;
        totalShares: number | null;
        smartAccountAddress: string | null;
    }>;
}
//# sourceMappingURL=agent-nft.controller.d.ts.map