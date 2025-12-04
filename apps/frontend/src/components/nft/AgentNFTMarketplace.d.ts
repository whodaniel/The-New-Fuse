import React from 'react';
interface AgentNFTMarketplaceProps {
    userAddress?: string;
    onMintNFT?: (agentId: string) => void;
    onFractionalize?: (agentNftId: string) => void;
    onBuyShares?: (listingId: string) => void;
    onMakeOffer?: (listingId: string, amount: string, shareAmount: number) => void;
    onListShares?: (agentNftId: string, shareAmount: number, pricePerShare: string) => void;
}
export declare const AgentNFTMarketplace: React.FC<AgentNFTMarketplaceProps>;
export {};
