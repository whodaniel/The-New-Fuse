import { PrismaService } from '../prisma/prisma.service';
import { AgentNFT, FractionalShare, RevenueStream, MarketplaceListing } from '@the-new-fuse/database/generated/prisma';
export interface MintAgentNftDto {
    agentId: string;
    ownerAddress: string;
    smartAccountAddress?: string;
    metadataUri?: string;
}
export interface FractionalizeAgentDto {
    agentNftId: string;
    totalShares: number;
    initialOwner: string;
}
export interface CreateRevenueStreamDto {
    agentNftId: string;
    streamName: string;
    description?: string;
    tokenAddress: string;
    distributionThreshold: string;
}
export interface DistributeRevenueDto {
    revenueStreamId: string;
    amount: string;
    txHash: string;
    blockNumber: number;
}
export declare class AgentNftService {
    private readonly prisma;
    private readonly logger;
    private agentNftContract;
    private marketplaceContract;
    private revenueDistributorContract;
    private provider;
    private wallet;
    constructor(prisma: PrismaService);
    private initializeContracts;
    mintAgentAsNft(data: MintAgentNftDto): Promise<AgentNFT>;
    fractionalizeAgent(data: FractionalizeAgentDto): Promise<AgentNFT>;
    createRevenueStream(data: CreateRevenueStreamDto): Promise<RevenueStream>;
    distributeRevenue(data: DistributeRevenueDto): Promise<void>;
    getAgentNft(agentId: string): Promise<AgentNFT | null>;
    getAgentNftByTokenId(tokenId: number): Promise<AgentNFT | null>;
    getUserFractionalShares(ownerAddress: string): Promise<FractionalShare[]>;
    getActiveMarketplaceListings(): Promise<MarketplaceListing[]>;
    updateAgentMetadata(agentId: string, metadataUri: string): Promise<AgentNFT>;
}
//# sourceMappingURL=agent-nft.service.d.ts.map