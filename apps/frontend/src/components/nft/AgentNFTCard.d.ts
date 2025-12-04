import React from 'react';
export interface AgentNFT {
    id: string;
    agent: {
        id: string;
        name: string;
        description?: string;
        type: string;
        capabilities: string[];
    };
    tokenId: number;
    contractAddress: string;
    smartAccountAddress?: string;
    isFractionalized: boolean;
    totalShares: number;
    metadataUri?: string;
    fractionalShares: FractionalShare[];
    revenueStreams: RevenueStream[];
    marketplaceListings: MarketplaceListing[];
    createdAt: string;
}
export interface FractionalShare {
    id: string;
    ownerAddress: string;
    shareAmount: number;
}
export interface RevenueStream {
    id: string;
    streamName: string;
    totalRevenue: string;
    distributedRevenue: string;
    isActive: boolean;
}
export interface MarketplaceListing {
    id: string;
    shareAmount: number;
    pricePerShare: string;
    totalPrice: string;
    status: string;
    seller: string;
}
interface AgentNFTCardProps {
    agentNft: AgentNFT;
    userAddress?: string;
    onMintNFT?: (agentId: string) => void;
    onFractionalize?: (agentNftId: string) => void;
    onViewDetails?: (agentNft: AgentNFT) => void;
    onBuyShares?: (listingId: string) => void;
    onManageRevenue?: (agentNftId: string) => void;
}
export declare const AgentNFTCard: React.FC<AgentNFTCardProps>;
export {};
